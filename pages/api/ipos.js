// pages/api/ipos.js
import fetch from "node-fetch";
import cheerio from "cheerio";

async function scrapeIPOCentral() {
  try {
    const html = await fetch("https://ipocentral.in/ipo-2025/").then(r => r.text());
    const $ = cheerio.load(html);

    const ipos = [];

    // Each IPO is usually inside a table row or card element
    $("table tbody tr").each((_, row) => {
      const tds = $(row).find("td");
      if (tds.length >= 4) {
        ipos.push({
          name: $(tds[0]).text().trim(),
          issueOpenDate: $(tds[1]).text().trim(),
          issueCloseDate: $(tds[2]).text().trim(),
          priceBand: $(tds[3]).text().trim(),
          source: "IPO Central"
          //status: "Upcoming"
        });
      }
    });

    return ipos;
  } catch (error) {
    console.error("Failed to scrape IPO Central:", error);
    return [];
  }
}

// Example combined handler (you can add other sources too)
export default async function handler(req, res) {
  try {
    const ipoCentralData = await scrapeIPOCentral();

    if (ipoCentralData.length === 0) {
      return res.status(200).json({
        upcoming: [],
        listed: [],
        message: "No data from IPO Central. Try again later."
      });
    }

    // Deduplicate if needed
    const uniqueIPOs = Array.from(
      new Map(ipoCentralData.map(ipo => [ipo.name.toLowerCase(), ipo])).values()
    );

    res.status(200).json({ upcoming: uniqueIPOs, listed: [] });
  } catch (err) {
    console.error("API handler failed:", err);
    res.status(500).json({ error: "Unable to fetch IPO data. Please try again later." });
  }
}
