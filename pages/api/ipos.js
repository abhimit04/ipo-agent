// pages/api/ipos.js
import fetch from "node-fetch";
import cheerio from "cheerio";

async function scrapeChittorgarh() {
  try {
    const html = await fetch("https://www.chittorgarh.com/ipo/upcoming-ipo/").then(r => r.text());
    const $ = cheerio.load(html);
    const ipos = [];
    $(".table.table-striped tbody tr").each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length >= 3) {
        ipos.push({
          name: $(tds[0]).text().trim(),
          issueOpenDate: $(tds[1]).text().trim(),
          issueCloseDate: $(tds[2]).text().trim(),
          status: "Upcoming"
        });
      }
    });
    return ipos;
  } catch (error) {
    console.error("Failed to scrape Chittorgarh:", error);
    return [];
  }
}

async function scrapeMoneyControl() {
  try {
    const resp = await fetch("https://priceapi.moneycontrol.com/ipo/upcoming", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!resp.ok) return [];
    const json = await resp.json();
    return json.map(ipo => ({
      name: ipo.company_name,
      issueOpenDate: ipo.open_date,
      issueCloseDate: ipo.close_date,
      status: "Upcoming"
    }));
  } catch (error) {
    console.error("Failed to fetch Moneycontrol IPO data:", error);
    return [];
  }
}

export default async function handler(req, res) {
  try {
    const [chittorgarhData, moneyControlData] = await Promise.all([
      scrapeChittorgarh(),
      scrapeMoneyControl()
    ]);

    // Merge + deduplicate IPOs by name
    const allIPOs = [...chittorgarhData, ...moneyControlData];
    const uniqueIPOs = Array.from(
      new Map(allIPOs.map(ipo => [ipo.name.toLowerCase(), ipo])).values()
    );

    if (uniqueIPOs.length === 0) {
      return res.status(200).json({ upcoming: [], listed: [], message: "No data available. Try again later." });
    }

    res.status(200).json({ upcoming: uniqueIPOs, listed: [] });
  } catch (err) {
    console.error("API handler failed:", err);
    res.status(500).json({ error: "Unable to fetch IPO data. Please try again later." });
  }
}
