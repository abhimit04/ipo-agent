import * as cheerio from "cheerio";
import fetch from "node-fetch";
import stringSimilarity from "string-similarity";
//import puppeteer from "puppeteer";
//import Redis from "ioredis";
//import redisClient from '../../lib/redis';
//import redis from '../../lib/redis';

// Initialize Redis
//const redis = new Redis(process.env.REDIS_URL, {
//  tls: process.env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
//});

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
// Company Details
    details.company = {};
    $("h3:contains('Company Details') + table tr").each((_, row) => {
      const key = $(row).find("td:first-child").text().trim();
      const value = $(row).find("td:last-child").text().trim();
      details.company[key] = value;
    });

    // Financial Summary
    details.financials = [];
    $("h3:contains('Financial Summary') + table tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length > 1) {
        const year = $(cells[0]).text().trim();
        const revenue = $(cells[1]).text().trim();
        const profit = $(cells[2]).text().trim();
        details.financials.push({ year, revenue, profit });
      }
    });

    return details;
  } catch (err) {
    console.error("Error scraping details:", err.message);
    return {};
  }
}

/** Scrape GMP Data from IPOWatch **/
async function scrapeGMPData() {
  try {
    const response = await fetch(
      "https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const html = await response.text();
    const $ = cheerio.load(html);

    const gmpData = [];
    $("table tbody tr").each((_, row) => {
      const tds = $(row).find("td");
      if (tds.length >= 4) {
        const name = $(tds[0]).text().trim();
        const gmp = $(tds[1]).text().trim();
        const price = $(tds[2]).text().trim();
        const gainPercent = $(tds[3]).text().trim();

        gmpData.push({ name, gmp, ipoPrice: price, gainPercent });
      }
    });

    return gmpData;
  } catch {
    return [];
  }
}

async function fetchGMPFromInvestorGain(ipoName) {
  try {
    const slug = ipoName.toLowerCase().replace(/\s+/g, "-");
    const url = `https://www.investorgain.com/gmp/${slug}-ipo-gmp/`;

    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await response.text();
    const $ = cheerio.load(html);

    const gmpText = $("table tr:contains('GMP') td:last-child").text().trim();
    return gmpText ? gmpText : null;
  } catch (err) {
    console.error(`❌ Error fetching GMP from InvestorGain for ${ipoName}:`, err.message);
    return null;
  }
}

// Multiple IPOs GMP fetcher
async function fetchGMPFromInvestorGainList(ipos) {
  const results = [];
  for (const ipo of ipos) {
    try {
      const gmp = await fetchGMPFromInvestorGain(ipo.name);
      if (gmp !== null) {
        results.push({ name: ipo.name, gmp });
      } else {
        console.warn(`⚠️ No GMP found for ${ipo.name} on InvestorGain`);
      }
    } catch (err) {
      console.error(`❌ Error fetching GMP for ${ipo.name}:`, err.message);
    }
  }
  return results;
}

function normalizeName(name) {
  return name
    .toLowerCase()
      .replace(/ltd\.?|limited/gi, "")
      .replace(/ipo/gi, "")
      .replace(/closing today/gi, "")
      .replace(/listing today/gi, "")
      .replace(/live/gi, "")
      .replace(/&.*/g, "").trim()
      .replace(/[^a-z0-9]/gi, "");
}

export default async function handler(req, res) {
  try {
    // Try fetching cached data first
//    const cached = await redisClient.get('ipos-data');
//        if (cached) {
//          return res.status(200).json(JSON.parse(cached));
//        }
       //const cached = await redis.get("ipos_cache");
       //if (cached) return res.status(200).json(JSON.parse(cached));
        //console.log("📦 Serving IPO data from Redis cache");

//    const [ipos, ipoCentralGMP, ipoInvestorGainGMP] = await Promise.all([
//      scrapeChittorgarhList(),
//      scrapeGMPData(),
//      fetchGMPFromInvestorGain(), // Fetch GMP data from IPOdekho as well
//    ]);

    const ipos = await scrapeChittorgarhList();
     const ipoCentralGMP = await scrapeGMPData();
    const ipoInvestorGainGMP = await fetchGMPFromInvestorGainList(ipos);

    const detailedIPOs = await Promise.all(
      ipos
        .filter((ipo) =>
          ["upcoming", "current"].includes(ipo.status.toLowerCase())
        )
        .map(async (ipo) => {
          const details = await scrapeChittorgarhDetails(ipo.detailUrl);

//          const gmpMatch = gmpData.find(
//            (g) => normalizeName(g.name) === normalizeName(ipo.name)
//          );
            let gmpMatch = ipoCentralGMP.find(
              (g) => normalizeName(ipo.name).includes(normalizeName(g.name))
                   || normalizeName(g.name).includes(normalizeName(ipo.name))
            );
            console.log("GMP Match from IPOWatch:", gmpMatch);
             if (!gmpMatch) {
              gmpMatch = ipoInvestorGainGMP.find((g) => normalizeName(g.name) === normalizeName(ipo.name));
              //console.log("GMP Match from InvestorGain:", gmpMatch);
             }

          return {
            ...ipo,
            ...details,
            gmp: gmpMatch?.gmp || null,
            gainPercent: gmpMatch?.gainPercent || null,
          };
        })
    );

    const finalIPOs = [
      ...detailedIPOs,
      ...ipos.filter((ipo) => ipo.status.toLowerCase() === "closed"),
    ];

    console.log(`Fetched ${finalIPOs.length} IPOs`);
    console.log("Fetched IPOs:", JSON.stringify(finalIPOs, null, 2));

    const upcoming = finalIPOs.filter(
      (ipo) => ipo.status.toLowerCase() === "upcoming"
    );
    const current = finalIPOs.filter(
      (ipo) => ipo.status.toLowerCase() === "current"
    );
    const listed = finalIPOs.filter(
      (ipo) => ipo.status.toLowerCase() === "closed"
    );

    // Cache result for 15 minutes
      //await redis.set("ipos_cache", JSON.stringify(response), { EX: 600 });
      //console.log("✅ IPO data cached in Redis (expires in 15 min)");

    res.status(200).json({ upcoming, current, listed });
  } catch {
    res.status(500).json({
      error: "Unable to fetch IPO data. Please try again later.",
    });
  }
}
