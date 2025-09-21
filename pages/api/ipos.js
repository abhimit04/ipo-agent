// pages/api/ipos.js
import * as cheerio from "cheerio";
import fetch from "node-fetch";

/** --- Scrape Chittorgarh Central --- **/
async function scrapeIPOCentral() {
  try {
    const response = await fetch("https://www.chittorgarh.com/ipo/", {
      headers: { "User-Agent": "Mozilla/5.0" },
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
          status: $(tds[3]).text().trim(), // Use status directly from table
          source: "Chittorgarh",
        });
      }
    });

    return ipos;
  } catch (error) {
    console.error("Failed to scrape Chittorgarh:", error);
    return [];
  }
}

/** --- API Handler --- **/
export default async function handler(req, res) {
  try {
    const ipos = await scrapeIPOCentral();

    if (ipos.length === 0) {
      return res.status(200).json({
        upcoming: [],
        listed: [],
        message: "No data available. Try again later.",
      });
    }

    // Filter IPOs based on status field
    const upcoming = ipos.filter((ipo) => ipo.status.toLowerCase() === "upcoming");
    const listed = ipos.filter((ipo) => ipo.status.toLowerCase() === "closed");

    console.log(JSON.stringify(ipos, null, 2));

    res.status(200).json({ upcoming, listed });
  } catch (err) {
    console.error("API handler failed:", err);
    res.status(500).json({
      error: "Unable to fetch IPO data. Please try again later.",
    });
  }
}
