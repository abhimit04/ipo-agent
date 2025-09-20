import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, TrendingUp, Star } from 'lucide-react';


export default function Home() {
const [ipos, setIpos] = useState({ upcoming: [], listed: [] });
const [loading, setLoading] = useState(true);


useEffect(() => {
async function fetchIpos() {
try {
const res = await fetch('/api/ipos');
const data = await res.json();
setIpos(data);
} catch (err) {
console.error('Failed to fetch IPOs', err);
} finally {
setLoading(false);
}
}
fetchIpos();
}, []);


if (loading) return <p className="text-center text-lg mt-10">Loading IPO data...</p>;


return (
<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
<header className="max-w-7xl mx-auto p-6 flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full p-2 shadow-md">
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
<path d="M12 2L15.09 8H21L16.45 11.97L18.54 18L12 14.02L5.46 18L7.55 11.97L3 8H8.91L12 2Z" fill="currentColor" />
</svg>
</main>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-2xl shadow">
            <h3 className="text-lg font-semibold">How it works</h3>
            <p className="text-sm text-slate-500 mt-2">We aggregate IPO feeds, scrape supplementary sources for GMP, and enrich listed IPOs with historical price data. LLM produces concise recommendations tagged with data sources.</p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow">
            <h3 className="text-lg font-semibold">For investors</h3>
            <p className="text-sm text-slate-500 mt-2">Quickly find high‑conviction listings, understand listing performance and decide watch/bid/skip with an evidence-backed summary.</p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow">
            <h3 className="text-lg font-semibold">For builders</h3>
            <p className="text-sm text-slate-500 mt-2">API-first design, easy to integrate into dashboards or notification systems. Free tier available for early testing.</p>
          </div>
        </div>
      </section>

      <footer className="mt-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-600">© {new Date().getFullYear()} IPOWatch. Not financial advice.</div>
          <div className="flex items-center gap-4">
            <a className="text-sm hover:underline">Terms</a>
            <a className="text-sm hover:underline">Privacy</a>
            <button className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded">Sign up</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
