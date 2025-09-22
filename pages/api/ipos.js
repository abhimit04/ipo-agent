import * as cheerio from "cheerio";
import fetch from "node-fetch";
import redis from "../../lib/redis.js"; // ✅ import redis connection

/** Scrape IPO List Page **/
async function scrapeChittorgarhList() {
  const response = await fetch("https://www.chittorgarh.com/ipo/", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await response.text();
  const $ = cheerio.load(html);

  const ipos = [];
  $("table tbody tr").each((_, row) => {
    const tds = $(row).find("td");
    if (tds.length >= 4) {
      const link = $(tds[0]).find("a").attr("href");
      ipos.push({
        name: $(tds[0]).text().trim(),
        issueOpenDate: $(tds[1]).text().trim(),
        issueCloseDate: $(tds[2]).text().trim(),
        status: $(tds[3]).text().trim(),
        detailUrl: link ? `https://www.chittorgarh.com${link}` : null,
        source: "Chittorgarh",
      });
    }
  });

  return ipos;
}

/** Scrape Individual IPO Detail Page **/
async function scrapeChittorgarhDetails(url) {
  if (!url) return {};
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const details = {};
    $("table.table tr").each((_, row) => {
      const label = $(row).find("td:first-child").text().trim();
      const value = $(row).find("td:last-child").text().trim();

      if (label.includes("Price Band")) details.priceBand = value;
      if (label.includes("Lot Size")) details.lotSize = value;
      if (label.includes("Issue Size")) details.issueSize = value;
      if (label.includes("Listing Date")) details.listingDate = value;
    });

    return details;
  } catch (err) {
    console.error(`Failed to fetch IPO details for ${url}`, err);
    return {};
  }
}

export default async function handler(req, res) {
  try {
    const cacheKey = "ipo_data_v1";

    // 1️⃣ Check cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log("📦 Serving IPO data from Redis cache");
      return res.status(200).json(JSON.parse(cachedData));
    }

    console.log("⏳ Cache miss → scraping Chittorgarh...");
    const ipos = await scrapeChittorgarhList();

    // Fetch details only for upcoming/current IPOs
    const detailedIPOs = await Promise.all(
      ipos
        .filter((ipo) =>
          ["upcoming", "current"].includes(ipo.status.toLowerCase())
        )
        .map(async (ipo) => ({
          ...ipo,
          ...(await scrapeChittorgarhDetails(ipo.detailUrl)),
        }))
    );

    const finalIPOs = [
      ...detailedIPOs,
      ...ipos.filter((ipo) => ipo.status.toLowerCase() === "closed"),
    ];

    const upcoming = finalIPOs.filter(
      (ipo) => ipo.status.toLowerCase() === "upcoming"
    );
    const current = finalIPOs.filter(
      (ipo) => ipo.status.toLowerCase() === "current"
    );
    const listed = finalIPOs.filter(
      (ipo) => ipo.status.toLowerCase() === "closed"
    );

    const responseData = { upcoming, current, listed };

    // 2️⃣ Cache the result (15 min TTL)
    await redis.set(cacheKey, JSON.stringify(responseData), "EX", 900);
    console.log("✅ IPO data cached in Redis (expires in 15 min)");

    res.status(200).json(responseData);
  } catch (err) {
    console.error("API handler failed:", err);
    res.status(500).json({
      error: "Unable to fetch IPO data. Please try again later.",
    });
  }
}
