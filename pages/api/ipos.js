// pages/api/ipos.js
import Parser from "rss-parser";

const NSE_RSS = "https://www.nseindia.com/rss/ipo.xml"; // Example feed
const MONEYCONTROL_RSS = "https://www.moneycontrol.com/rss/ipo/"; // Example feed

const parser = new Parser();

async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const feed = await parser.parseURL(url);
    return feed.items.map(item => ({
      name: item.title || "Unknown IPO",
      issueOpenDate: item.pubDate || "N/A",
      issueCloseDate: "N/A",
      status: "Upcoming"
    }));
  } catch (err) {
    console.error(`Failed to fetch RSS feed from ${url}:`, err.message);
    return [];
  } finally {
    clearTimeout(id);
  }
}

export default async function handler(req, res) {
  try {
    const results = await Promise.allSettled([
      fetchWithTimeout(NSE_RSS),
      fetchWithTimeout(MONEYCONTROL_RSS)
    ]);

    // Merge and deduplicate IPOs
    const allIPOs = results
      .filter(r => r.status === "fulfilled")
      .flatMap(r => r.value);

    const uniqueIPOs = Array.from(
      new Map(allIPOs.map(ipo => [ipo.name.toLowerCase(), ipo])).values()
    );

    if (uniqueIPOs.length === 0) {
      return res.status(200).json({
        upcoming: [],
        listed: [],
        message: "No data available. Try again later."
      });
    }

    res.status(200).json({ upcoming: uniqueIPOs, listed: [] });
  } catch (err) {
    console.error("API handler failed:", err);
    res.status(500).json({
      upcoming: [],
      listed: [],
      message: "Unable to fetch IPO data. Try again later."
    });
  }
}
