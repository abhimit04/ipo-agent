// pages/api/ipos.js
import * as cheerio from "cheerio";
import fetch from "node-fetch";

/** --- Scrape IPO Central --- **/
async function scrapeIPOCentral() {
  try {
    const response = await fetch("https://ipocentral.in/upcoming-ipo-calendar/", {
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
  try {
    const response = await fetch("https://www.moneycontrol.com/ipo/", {
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
          source: "Moneycontrol"
          status: "Open",
        });
      }
    });

    return ipos;
  } catch (error) {
    console.error("Failed to scrape Moneycontrol:", error);
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

    res.status(200).json({ upcoming: uniqueIPOs, listed: [] });
  } catch (err) {
    console.error("API handler failed:", err);
    res.status(500).json({
      error: "Unable to fetch IPO data. Please try again later.",
    });
  }
}
