import * as cheerio from "cheerio";
import fetch from "node-fetch";
import stringSimilarity from "string-similarity";
import { saveIPOToDB,getIPOFromDB } from "../../lib/db.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

//const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
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
      if (label.includes("Tentative Allotment")) details.allotmentDate = value;
      if (label.includes("Initiation of Refunds")) details.refund = value;
      if (label.includes("Credit of Shares to Demat")) details.demat = value;
      //console.log(`Parsed ${label}: ${value}`);
    });
// Company About
   const aboutHeading = $("h2, h3").filter((_, el) => $(el).text().trim().startsWith("About ")).first();
   const ipoName = aboutHeading.text().trim().replace("About ", "");

   // Step 2: Check Supabase for existing data
     const existing = await getIPOFromDB(ipoName);
     if (existing && existing.about && existing.financials) {
       console.log(`IPO "${ipoName}" already in Supabase. Skipping scrape.`);
       return { ...details, name: ipoName, about: existing.about, financials: existing.financials }; // return data directly
     }

   details.company = {};
   const aboutSection = [];

   $("h2, h3").filter((_, el) => $(el).text().trim().startsWith("About "))
     .nextUntil("h2, h3") // grab everything until the next heading
     .each((_, el) => {
       aboutSection.push($(el).text().trim());
     });

   details.about = aboutSection.join("\n\n");
   console.log("Company About:", details.company.about);

    // Financials
    // Extract Company Financials (raw, full text)
    details.financials = [];

    const financialsSection = [];
    $("h2, h3").filter((_, el) => $(el).text().trim().includes("Company Financials"))
      .nextUntil("h2, h3")
      .each((_, el) => {
        financialsSection.push($(el).text().trim());
      });

    details.financials = financialsSection.join("\n\n");
    console.log("Company Financials:", details.financials);

    // Save to DB
    await saveIPOToDB(ipoName, details.company.about, details.financials);

    return {
      ...details,
      name: ipoName,
      company: { about: details.company.about || details.about },
      financials: details.financials
    };

  } catch (err) {
    console.error("Error scraping details:", err.message);
    return {};
  }
}

/** Scrape GMP Data from IPOWatch */
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

// ===== NEW FUNCTION: Scrape News from multiple sources =====
async function scrapeIPONews(ipoName) {
  const sources = [
    { name: "Moneycontrol", url: `https://www.moneycontrol.com/news/tags/${ipoName}` },
    { name: "ZeeBusiness", url: `https://www.zeebiz.com/search?q=${ipoName}` },
    { name: "Quint", url: `https://www.thequint.com/search?q=${ipoName}` },
    { name: "Economic Times", url: `https://economictimes.indiatimes.com/topic/${ipoName}` },
  ];

  const allNews = [];

  for (const source of sources) {
    try {
      const res = await fetch(source.url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await res.text();
      const $ = cheerio.load(html);

      // Extract titles and links (generic selector; may need site-specific tweaks)
      $("a").each((_, el) => {
        const title = $(el).text().trim();
        const link = $(el).attr("href");
        if (title && link) {
          allNews.push({ source: source.name, title, link });
        }
      });
    } catch (err) {
      console.error(`Error fetching news from ${source.name}:`, err.message);
    }
  }

  return allNews;
  ///console.log(allNews);
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// ✅ Switch to Gemini 2.5 Pro
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

// ===== NEW FUNCTION: Send IPO data + news to Gemini AI ==
async function summarizeIPO({ ipoName, details, news }) {
  const headlinesList = news.map(
    (item) => `- ${item.title} (${item.source} - ${item.link})`
  );

  const prompt = `
You are a financial analyst. Summarize the following IPO details and news:
IPO: ${ipoName}
Details: ${JSON.stringify(details)}
News Headlines:
${headlinesList.join("\n")}

Return:
1. Key Summary
2. Risks
3. Market Sentiment
4. Recommendation: SUBSCRIBE / AVOID / HOLD
`;

  const result = await model.generateContent(prompt);

  // ✅ SDK response returns `.response.text()`
  const summaryText = result.response?.text() || "No summary available";

  return summaryText;

  console.log(summaryText);
}


//async function fetchGMPFromInvestorGain(ipoName) {
//  try {
//    const slug = ipoName.toLowerCase().replace(/\s+/g, "-");
//    const url = `https://www.investorgain.com/gmp/${slug}-ipo-gmp/`;
//
//    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
//    const html = await response.text();
//    const $ = cheerio.load(html);
//
//    const gmpText = $("table tr:contains('GMP') td:last-child").text().trim();
//    return gmpText ? gmpText : null;
//  } catch (err) {
//    console.error(`❌ Error fetching GMP from InvestorGain for ${ipoName}:`, err.message);
//    return null;
//  }
//}

// Multiple IPOs GMP fetcher
//async function fetchGMPFromInvestorGainList(ipos) {
//  const results = [];
//  for (const ipo of ipos) {
//    try {
//      const gmp = await fetchGMPFromInvestorGain(ipo.name);
//      if (gmp !== null) {
//        results.push({ name: ipo.name, gmp });
//      } else {
//        console.warn(`⚠️ No GMP found for ${ipo.name} on InvestorGain`);
//      }
//    } catch (err) {
//      console.error(`❌ Error fetching GMP for ${ipo.name}:`, err.message);
//    }
//  }
//  return results;
//}

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
    //const ipoInvestorGainGMP = await fetchGMPFromInvestorGainList(ipos);

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
//             if (!gmpMatch) {
//              gmpMatch = ipoInvestorGainGMP.find((g) => normalizeName(g.name) === normalizeName(ipo.name));
//              //console.log("GMP Match from InvestorGain:", gmpMatch);
//             }

            // ===== NEW: Fetch news ===
            const news = await scrapeIPONews(ipo.name);
            console.log(news);

                  // ===== NEW: Call Gemini AI to summarize =
            const aiSummary = summarizeIPO({
            ipoName: ipo.name,
            details,
            news,
            });
            console.log(aiSummary);

          return {
            ...ipo,
            ...details,
            gmp: gmpMatch?.gmp || null,
            gainPercent: gmpMatch?.gainPercent || null,
            aiSummary: aiSummary || null,

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

    // Cache result for 15 min
      //await redis.set("ipos_cache", JSON.stringify(response), { EX: 600 });
      //console.log("✅ IPO data cached in Redis (expires in 15 min)");

    res.status(200).json({ upcoming, current, listed });
  } catch {
    res.status(500).json({
      error: "Unable to fetch IPO data. Please try again later.",
    });
  }
}
