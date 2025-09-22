// pages/api/ipos.js
import * as cheerio from "cheerio";
import fetch from "node-fetch";

/** --- Scrape Chittorgarh --- **/
async function scrapeChittorgarh() {
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
          status: $(tds[3]).text().trim(), // already contains "Upcoming", "Current", "Closed"
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

/** --- Scrape InvestorGain --- **/
async function scrapeInvestorGain() {
  try {
    const response = await fetch("https://www.investorgain.com/report/live-ipo-gmp/331/", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const ipos = [];
    $("table tbody tr").each((i, row) => {
      const tds = $(row).find("td");
      if (tds.length < 12) return; // skip invalid rows

      const name = $(tds[0]).text().trim();
      if (!name) return;

      ipos.push({
        name,
        GMP: $(tds[1]).text().trim(),
        price: $(tds[5]).text().trim(),
        iposize: $(tds[6]).text().trim(),
        lotsize: $(tds[7]).text().trim(),
        openDate: $(tds[8]).text().trim(),
        closeDate: $(tds[9]).text().trim(),
        boadate: $(tds[10]).text().trim(),
        listingdate: $(tds[11]).text().trim(),
        source: "InvestorGain",
      });
    });

    console.log("InvestorGain rows scraped:", ipos.length);
    return ipos;
  } catch (error) {
    console.error("Failed to scrape InvestorGain:", error);
    return [];
  }
}


/** --- Merge & Deduplicate by Name --- **/
function mergeIpoData(chittorgarhData, investorGainData) {
  const ipoMap = new Map();

  // First add Chittorgarh IPOs
  for (const ipo of chittorgarhData) {
    ipoMap.set(ipo.name.toLowerCase(), { ...ipo });
  }

  // Merge with InvestorGain data
  for (const ipo of investorGainData) {
    const key = ipo.name.toLowerCase();
    if (ipoMap.has(key)) {
      ipoMap.set(key, { ...ipoMap.get(key), ...ipo }); // Merge fields
    } else {
      ipoMap.set(key, ipo); // Add if not present in Chittorgarh
    }
  }

  return Array.from(ipoMap.values());
}

/** --- API Handler --- **/
export default async function handler(req, res) {
  try {
    const [chittorgarhData, investorGainData] = await Promise.all([
      scrapeChittorgarh(),
      scrapeInvestorGain(),
    ]);
    console.log("Chittorgarh IPOs:", chittorgarhData.length);
    console.log("InvestorGain IPOs:", investorGainData.length);

    const combinedIpos = mergeIpoData(chittorgarhData, investorGainData);


    if (combinedIpos.length === 0) {
      return res.status(200).json({
        upcoming: [],
        current: [],
        listed: [],
        message: "No data available. Try again later.",
      });
    }

    // Filter by status (case-insensitive)
    const upcoming = combinedIpos.filter(
      (ipo) => ipo.status?.toLowerCase() === "upcoming"
    );
    const current = combinedIpos.filter(
      (ipo) => ipo.status?.toLowerCase() === "current"
    );
    const listed = combinedIpos.filter(
      (ipo) => ipo.status?.toLowerCase() === "closed"
    );

    console.log(JSON.stringify(combinedIpos, null, 2));

    res.status(200).json({ upcoming, current, listed });
  } catch (err) {
    console.error("API handler failed:", err);
    res.status(500).json({
      error: "Unable to fetch IPO data. Please try again later.",
    });
  }
}
