// pages/api/ipos.js
import * as cheerio from "cheerio";
import fetch from "node-fetch";

/** --- Scrape IPO Central --- **/
async function scrapeIPOCentral() {
  try {
    const response = await fetch("https://ipocentral.in/ipo-2025/", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const ipos = [];
    $("table tbody tr").each((_, row) => {
      const tds = $(row).find("td");
      if (tds.length >= 4) {
        ipos.push({
          name: $(tds[0]).text().trim(),
          issueOpenDate: $(tds[1]).text().trim(),
          issueCloseDate: $(tds[2]).text().trim(),
          priceBand: $(tds[3]).text().trim(),
          source: "IPO Central",
          status: "Upcoming",
        });
      }
    });

    return ipos;
  } catch (error) {
    console.error("Failed to scrape IPO Central:", error);
    return [];
  }
}

/** --- Scrape Moneycontrol (API) --- **/
async function scrapeMoneyControl() {
  const baseUrl = "https://www.moneycontrol.com";
  const ipoListUrl = `${baseUrl}/ipo/mainline`;

  try {
    const listHtml = await fetch(ipoListUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    }).then(r => r.text());

    const $ = cheerio.load(listHtml);
    const ipos = [];

    // Select IPO rows from Moneycontrol's table (open/ongoing IPOs)
    $("table tbody tr").each((_, row) => {
      const link = $(row).find("td a").attr("href");
      if (link) {
        ipos.push(`${baseUrl}${link}`);
      }
    });

    // Visit each IPO detail page and extract structured data
    const detailedIpos = await Promise.all(
      ipos.map(async (url) => {
        try {
          const html = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" }
          }).then(r => r.text());

          const $$ = cheerio.load(html);

          const name = $$(".inid_name").text().trim() || $$(".FL h1").text().trim();

          // Extract Details Table
          const details = {};
          $$(".inid_table tr").each((_, tr) => {
            const tds = $$(tr).find("td");
            if (tds.length === 2) {
              const key = $$(tds[0]).text().trim();
              const val = $$(tds[1]).text().trim();
              details[key] = val;
            }
          });

          // Extract Subscription Data
          const subscriptions = {};
          $$(".subs_table tr").each((_, tr) => {
            const tds = $$(tr).find("td");
            if (tds.length === 2) {
              const category = $$(tds[0]).text().trim();
              const times = $$(tds[1]).text().trim();
              subscriptions[category] = times;
            }
          });

          // Extract Important Dates (Basis, Refund, Credit, Listing)
          const dates = {};
          $$(".imp_dates li").each((_, li) => {
            const label = $$(li).find(".FL").text().trim();
            const date = $$(li).find(".FR").text().trim();
            dates[label] = date;
          });

          return {
            name,
            issueOpenDate: details["Open Date"] || null,
            issueCloseDate: details["Close Date"] || null,
            priceBand: details["Issue Price"] || null,
            lotSize: details["Lot Size"] || null,
            issueSize: details["Issue Size"] || null,
            timesSubscribed: details["Times Subscribed"] || null,
            subscriptions,
            importantDates: dates,
            source: "Moneycontrol",
            status: "Open",
            url
          };
        } catch (err) {
          console.error(`Failed to scrape Moneycontrol IPO page ${url}:`, err);
          return null;
        }
      })
    );
    console.log(`Scraped ${detailedIpos.length} IPOs from Moneycontrol.`);
    return detailedIpos.filter(Boolean); // remove nulls if any failed
  } catch (error) {
    console.error("Failed to fetch Moneycontrol IPO data:", error);
    return [];
  }
}
/** --- API Handler --- **/
export default async function handler(req, res) {
  try {
    const [ipoCentralData, moneyControlData] = await Promise.all([
      scrapeIPOCentral(),
      scrapeMoneyControl(),
    ]);

    // Merge & deduplicate by name (case-insensitive)
    const allIPOs = [...ipoCentralData, ...moneyControlData];
    const uniqueIPOs = Array.from(
      new Map(allIPOs.map((ipo) => [ipo.name.toLowerCase(), ipo])).values()
    );

    if (uniqueIPOs.length === 0) {
      return res.status(200).json({
        upcoming: [],
        listed: [],
        message: "No data available. Try again later.",
      });
    }
    console.log(JSON.stringify(uniqueIPOs, null, 2));
    res.status(200).json({ upcoming: uniqueIPOs, listed: [] });

  } catch (err) {
    console.error("API handler failed:", err);
    res.status(500).json({
      error: "Unable to fetch IPO data. Please try again later.",
    });
  }
}
