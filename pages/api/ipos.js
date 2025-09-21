import fetch from 'node-fetch';
import Parser from 'rss-parser';

const parser = new Parser();

// Function to fetch IPO data from NSE RSS feed
async function fetchNSEIPOs() {
  try {
    const feed = await parser.parseURL('https://www.nseindia.com/rss-feed');
    return feed.items.map(item => ({
      name: item.title,
      issueOpenDate: item.pubDate,
      issueCloseDate: item.pubDate,
      status: 'Upcoming',
    }));
  } catch (error) {
    console.error('Failed to fetch NSE IPO data:', error);
    return [];
  }
}

// Function to fetch IPO data from Moneycontrol API
async function fetchMoneycontrolIPOs() {
  try {
    const response = await fetch('https://priceapi.moneycontrol.com/ipo/upcoming', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.map(ipo => ({
      name: ipo.company_name,
      issueOpenDate: ipo.open_date,
      issueCloseDate: ipo.close_date,
      status: 'Upcoming',
    }));
  } catch (error) {
    console.error('Failed to fetch Moneycontrol IPO data:', error);
    return [];
  }
}

export default async function handler(req, res) {
  try {
    const [nseIPOs, moneycontrolIPOs] = await Promise.all([fetchNSEIPOs(), fetchMoneycontrolIPOs()]);

    // Merge and deduplicate IPOs by name
    const allIPOs = [...nseIPOs, ...moneycontrolIPOs];
    const uniqueIPOs = Array.from(
      new Map(allIPOs.map(ipo => [ipo.name.toLowerCase(), ipo])).values()
    );

    if (uniqueIPOs.length === 0) {
      return res.status(200).json({ upcoming: [], listed: [], message: 'No data available. Try again later.' });
    }

    res.status(200).json({ upcoming: uniqueIPOs, listed: [] });
  } catch (err) {
    console.error('API handler failed:', err);
    res.status(500).json({ error: 'Unable to fetch IPO data. Please try again later.' });
  }
}
