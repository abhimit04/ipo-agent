// pages/api/ipos.js (Next.js API Route)
// Fetches upcoming & listed IPOs using IPOAlerts first, then falls back to scraping Chittorgarh / Moneycontrol
// For listed IPOs, fetch historical data directly from NSE (scraping) instead of using jugaad-data

import fetch from "node-fetch";
import cheerio from "cheerio";

const IPO_ALERTS_API_KEY = process.env.IPO_ALERTS_API_KEY;
const IPO_ALERTS_URL = "https://api.ipoalerts.in/api/v1/ipo";

async function fetchFromIPOAlerts() {
  try {
    const resp = await fetch(`${IPO_ALERTS_URL}?status=all`, {
      headers: { "x-api-key": IPO_ALERTS_API_KEY },
    });
    if (!resp.ok) {
      console.error(`Error fetching from IPOAlerts: HTTP status ${resp.status}`);
      return null;
    }
    return await resp.json();
  } catch (error) {
    console.error("Failed to fetch from IPOAlerts API:", error);
    return null;
  }
}

async function scrapeChittorgarh() {
  try {
    const html = await fetch("https://www.chittorgarh.com/ipo/upcoming-ipo/").then(r => r.text());
    const $ = cheerio.load(html);
    const ipos = [];
    $(".table.table-striped tr").each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length > 0) {
        ipos.push({
          name: $(tds[0]).text().trim(),
          issueOpenDate: $(tds[1]).text().trim(),
          issueCloseDate: $(tds[2]).text().trim(),
          status: "Upcoming"
        });
      }
    });
    return { data: ipos };
  } catch (error) {
    console.error("Failed to scrape Chittorgarh:", error);
    return null;
  }
}

async function scrapeMoneyControl() {
  try {
    const html = await fetch("https://www.moneycontrol.com/ipo/").then(r => r.text());
    const $ = cheerio.load(html);
    const ipos = [];
    $(".tblList tbody tr").each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length > 0) {
        ipos.push({
          name: $(tds[0]).text().trim(),
          issueOpenDate: $(tds[1]).text().trim(),
          issueCloseDate: $(tds[2]).text().trim(),
          status: "Upcoming"
        });
      }
    });
    return { data: ipos };
  } catch (error) {
    console.error("Failed to scrape Moneycontrol:", error);
    return null;
  }
}

// Function to fetch historical prices from NSE for a given symbol
async function fetchNSEHistorical(symbol, startDate, endDate) {
  try {
    const url = `https://www.nseindia.com/api/historical/cm/equity?symbol=${symbol}&series=[\"EQ\"]&from=${startDate}&to=${endDate}`;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json, text/plain, */*"
      }
    });
    if (!resp.ok) {
      console.error(`Error fetching historical data for ${symbol} from NSE: HTTP status ${resp.status}`);
      return [];
    }
    const data = await resp.json();
    return data['data'].map(d => ({ date: d[0], close: parseFloat(d[4]) }));
  } catch (error) {
    console.error(`Failed to fetch historical data for ${symbol}:`, error);
    return [];
  }
}

export default async function handler(req, res) {
  try {
    // 1. Try IPOAlerts API first
    let ipoData = await fetchFromIPOAlerts();

    // 2. Fallback to scraping if API not available
    if (!ipoData) {
      ipoData = await scrapeChittorgarh();
    }
    if (!ipoData) {
      ipoData = await scrapeMoneyControl();
    }

    if (!ipoData) {
      throw new Error("Unable to fetch IPO data from any source.");
    }

    // Enrich listed IPOs with NSE historical performance
    const listedIPOs = (ipoData.data || []).filter((ipo) => ipo.status === "Listed");
    const enrichedListed = await Promise.all(
      listedIPOs.map(async (ipo) => {
        try {
          if (!ipo.symbol) return { ...ipo, performance: null };
          const hist = await fetchNSEHistorical(ipo.symbol, ipo.listingDate, new Date().toISOString().split("T")[0]);
          if (!hist || hist.length === 0) return { ...ipo, performance: null };
          const firstClose = hist[0].close;
          const lastClose = hist[hist.length - 1].close;
          const returnsPct = (((lastClose - firstClose) / firstClose) * 100).toFixed(2);
          return { ...ipo, performance: { firstClose, lastClose, returnsPct } };
        } catch (error) {
          console.error(`Failed to enrich listed IPO ${ipo.symbol}:`, error);
          return { ...ipo, performance: null };
        }
      })
    );

    const upcoming = (ipoData.data || []).filter((ipo) => ipo.status !== "Listed");

    res.status(200).json({ upcoming, listed: enrichedListed });
  } catch (err) {
    console.error("API handler failed:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
}
