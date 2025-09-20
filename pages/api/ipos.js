// pages/api/ipos.js (Next.js API Route)
// Fetches upcoming & listed IPOs using IPOAlerts first, then falls back to scraping Chittorgarh or Moneycontrol

import fetch from "node-fetch";
import cheerio from "cheerio";
import { historical } from "jugaad-data";

const IPO_ALERTS_API_KEY = process.env.IPO_ALERTS_API_KEY;
const IPO_ALERTS_URL = "https://api.ipoalerts.in/api/v1/ipo";

async function fetchFromIPOAlerts() {
  try {
    const resp = await fetch(`${IPO_ALERTS_URL}?status=all`, {
      headers: { "x-api-key": IPO_ALERTS_API_KEY },
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
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
  } catch {
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
  } catch {
    return null;
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

    // If IPOAlerts data, check for listed and enrich
    const listedIPOs = (ipoData.data || []).filter((ipo) => ipo.status === "Listed");
    const enrichedListed = await Promise.all(
      listedIPOs.map(async (ipo) => {
        try {
          const symbol = ipo.symbol ? `${ipo.symbol}.NS` : null;
          if (!symbol) return { ...ipo, performance: null };
          const hist = await historical(symbol, {
            start_date: ipo.listingDate,
            end_date: new Date().toISOString().split("T")[0],
          });
          if (!hist || hist.length === 0) return { ...ipo, performance: null };
          const firstClose = hist[0].close;
          const lastClose = hist[hist.length - 1].close;
          const returnsPct = (((lastClose - firstClose) / firstClose) * 100).toFixed(2);
          return { ...ipo, performance: { firstClose, lastClose, returnsPct } };
        } catch {
          return { ...ipo, performance: null };
        }
      })
    );

    const upcoming = (ipoData.data || []).filter((ipo) => ipo.status !== "Listed");

    res.status(200).json({ upcoming, listed: enrichedListed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
