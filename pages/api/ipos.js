// pages/api/ipos.js
// Improved fail-safe IPO data API

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
      console.warn(`IPOAlerts returned HTTP ${resp.status}`);
      return null;
    }
    return await resp.json();
  } catch (error) {
    console.warn("IPOAlerts fetch failed:", error.message);
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
    console.warn("Chittorgarh scrape failed:", error.message);
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
    console.warn("Moneycontrol scrape failed:", error.message);
    return null;
  }
}

async function fetchNSEHistorical(symbol, startDate, endDate) {
  try {
    const url = `https://www.nseindia.com/api/historical/cm/equity?symbol=${symbol}&series=["EQ"]&from=${startDate}&to=${endDate}`;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json, text/plain, */*"
      }
    });
    if (!resp.ok) {
      console.warn(`NSE historical failed for ${symbol}: HTTP ${resp.status}`);
      return [];
    }
    const data = await resp.json();
    return data?.data?.map(d => ({ date: d[0], close: parseFloat(d[4]) })) || [];
  } catch (error) {
    console.warn(`NSE historical fetch error for ${symbol}:`, error.message);
    return [];
  }
}

export default async function handler(req, res) {
  let upcoming = [];
  let listed = [];
  let message = null;

  try {
    // 1️⃣ Try IPOAlerts first
    let ipoData = await fetchFromIPOAlerts();

    // 2️⃣ Fallbacks if IPOAlerts fails
    if (!ipoData) ipoData = await scrapeChittorgarh();
    if (!ipoData) ipoData = await scrapeMoneyControl();

    if (!ipoData || !ipoData.data || ipoData.data.length === 0) {
      message = "No IPO data available. Try again later.";
    } else {
      const listedIPOs = ipoData.data.filter((ipo) => ipo.status === "Listed");
      const enrichedListed = await Promise.all(
        listedIPOs.map(async (ipo) => {
          try {
            if (!ipo.symbol) return { ...ipo, performance: null };
            const hist = await fetchNSEHistorical(
              ipo.symbol,
              ipo.listingDate,
              new Date().toISOString().split("T")[0]
            );
            if (!hist.length) return { ...ipo, performance: null };

            const firstClose = hist[0].close;
            const lastClose = hist[hist.length - 1].close;
            const returnsPct = (((lastClose - firstClose) / firstClose) * 100).toFixed(2);

            return { ...ipo, performance: { firstClose, lastClose, returnsPct } };
          } catch (err) {
            console.warn(`Failed to enrich listed IPO ${ipo.symbol}:`, err.message);
            return { ...ipo, performance: null };
          }
        })
      );

      listed = enrichedListed;
      upcoming = ipoData.data.filter((ipo) => ipo.status !== "Listed");
    }

    res.status(200).json({ upcoming, listed, message });
  } catch (err) {
    console.error("API handler crashed unexpectedly:", err);
    res.status(200).json({
      upcoming: [],
      listed: [],
      message: "No IPO data available. Try again later."
    });
  }
}
