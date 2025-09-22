import * as cheerio from "cheerio";
import fetch from "node-fetch";

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

        gmpData.push({
          name,
          gmp,
          ipoPrice: price,
          gainPercent,
        });
      }
    });

    return gmpData;
  } catch (err) {
    console.error("Failed to scrape GMP data", err);
    return [];
  }
}

export default async function handler(req, res) {
  try {
    const [ipos, gmpData] = await Promise.all([
      scrapeChittorgarhList(),
      scrapeGMPData(),
    ]);

    // Fetch details for only upcoming/current IPOs
    const detailedIPOs = await Promise.all(
      ipos
        .filter((ipo) =>
          ["upcoming", "current"].includes(ipo.status.toLowerCase())
        )
        .map(async (ipo) => {
          const details = await scrapeChittorgarhDetails(ipo.detailUrl);

          // Try to find matching GMP data by name (case-insensitive)
          const gmpMatch = gmpData.find(
            (g) => g.name.toLowerCase() === ipo.name.toLowerCase()
          );

          return {
            ...ipo,
            ...details,
            gmp: gmpMatch?.gmp || null,
            gainPercent: gmpMatch?.gainPercent || null,
          };
        })
    );

    // Merge with closed IPOs (no extra details needed)
    const finalIPOs = [
      ...detailedIPOs,
      ...ipos.filter((ipo) => ipo.status.toLowerCase() === "closed"),
    ];

    console.log(`Fetched ${finalIPOs.length} IPOs`);
    console.log("Fetched IPOs:", JSON.stringify(finalIPOs, null, 2));
    // Group by status
    const upcoming = finalIPOs.filter(
      (ipo) => ipo.status.toLowerCase() === "upcoming"
    );
    const current = finalIPOs.filter(
      (ipo) => ipo.status.toLowerCase() === "current"
    );
    const listed = finalIPOs.filter(
      (ipo) => ipo.status.toLowerCase() === "closed"
    );

    res.status(200).json({ upcoming, current, listed });
  } catch (err) {
    console.error("API handler failed:", err);
    res.status(500).json({
      error: "Unable to fetch IPO data. Please try again later.",
    });
  }
}
