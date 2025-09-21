// pages/api/ipos.js
import fetch from "node-fetch";
import Parser from "rss-parser";

const parser = new Parser();

// Helper to sanitize XML (fix unescaped &)
function sanitizeXML(xml) {
  return xml.replace(/&(?!(?:amp|lt|gt|quot|apos);)/g, "&amp;");
}

// Fetch NSE IPO RSS feed
async function fetchNSERSS() {
  try {
    const res = await fetch("https://www.nseindia.com/rss/IPOs.xml");
    let xml = await res.text();
    xml = sanitizeXML(xml);

    const feed = await parser.parseString(xml);
    return feed.items.map(item => ({
      name: item.title,
      link: item.link,
      pubDate: item.pubDate,
      status: "Upcoming"
    }));
  } catch (err) {
    console.error("Failed to fetch NSE IPO data:", err);
    return [];
  }
}

// Fetch Moneycontrol IPO RSS feed
async function fetchMoneycontrolRSS() {
  try {
    const res = await fetch("https://www.moneycontrol.com/rss/ipo.xml");
    let xml = await res.text();
    xml = sanitizeXML(xml);

    const feed = await parser.parseString(xml);
    return feed.items.map(item => ({
      name: item.title,
      link: item.link,
      pubDate: item.pubDate,
      status: "Upcoming"
    }));
  } catch (err) {
    console.error("Failed to fetch Moneycontrol IPO data:", err);
    return [];
  }
}

export default async function handler(req, res) {
  try {
    const [nseData, moneyControlData] = await Promise.all([
      fetchNSERSS(),
      fetchMoneycontrolRSS()
    ]);

    const allIPOs = [...nseData, ...moneyControlData];

    // Deduplicate by name
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

    res.status(200).json({
      upcoming: uniqueIPOs,
      listed: []
    });
  } catch (err) {
    console.error("API handler failed:", err);
    res.status(500).json({ error: "Unable to fetch IPO data. Please try again later." });
  }
}
