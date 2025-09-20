import React from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, TrendingUp, Star } from 'lucide-react';

// Landing.jsx — single-file React component (Tailwind CSS assumed)
// Default export a component ready to drop into a Next.js / CRA app.

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="max-w-7xl mx-auto p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full p-2 shadow-md">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 2L15.09 8H21L16.45 11.97L18.54 18L12 14.02L5.46 18L7.55 11.97L3 8H8.91L12 2Z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-lg">IPOWatch</div>
            <div className="text-xs text-slate-500">Track. Analyze. Advise.</div>
          </div>
        </div>
        <nav className="flex items-center gap-4">
          <a className="text-sm hover:text-slate-700">Features</a>
          <a className="text-sm hover:text-slate-700">Past IPOs</a>
          <a className="text-sm hover:text-slate-700">GMP</a>
          <button className="ml-2 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md shadow-md hover:brightness-110">Get Early Access</button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <section>
          <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl font-extrabold leading-tight">
            Track India IPOs with real-time GMP and data-driven advice
          </motion.h1>
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 text-lg text-slate-600">
            IPOWatch combines reliable IPO feeds, historical performance, and crowd‑sourced GMP to give a concise, no‑nonsense view. Integrated LLM summaries provide quick pros, cons, and suggested horizons.
          </motion.p>

          <div className="mt-8 flex gap-3 flex-wrap">
            <button className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-lg shadow hover:scale-[1.01]">Try Demo</button>
            <button className="inline-flex items-center gap-2 border border-slate-200 px-5 py-3 rounded-lg text-slate-700">View Docs</button>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center gap-3"><Search className="w-5 h-5 text-indigo-600" /><div className="text-sm font-medium">Real-time IPO list</div></div>
              <div className="text-xs text-slate-500 mt-2">Upcoming, open & listed IPOs from multiple sources.</div>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center gap-3"><TrendingUp className="w-5 h-5 text-green-600" /><div className="text-sm font-medium">Historical Performance</div></div>
              <div className="text-xs text-slate-500 mt-2">Listing returns, 1/3/6-month trends and charts.</div>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-amber-500" /><div className="text-sm font-medium">GMP Estimates</div></div>
              <div className="text-xs text-slate-500 mt-2">Crowd + scraped GMP signals (marked unofficial).</div>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center gap-3"><Star className="w-5 h-5 text-pink-500" /><div className="text-sm font-medium">LLM Insights</div></div>
              <div className="text-xs text-slate-500 mt-2">Short, audit‑friendly advice produced by an LLM.</div>
            </div>
          </div>
        </section>

        <section className="hidden lg:flex items-center justify-center">
          <div className="w-full max-w-lg bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">Upcoming IPO</div>
                <div className="text-xl font-semibold mt-1">Neotech Labs Ltd</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">GMP</div>
                <div className="text-xl font-bold text-amber-600 mt-1">+₹ 45</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-slate-500">Issue Dates</div>
              <div className="text-sm">Oct 10, 2025 — Oct 14, 2025</div>
            </div>

            <div className="mt-4 bg-white p-3 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500">LLM Advice</div>
              <div className="text-sm mt-1">Consider waiting for listing price confirmation. Small lot size; moderate risk for short-term traders.</div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 py-3 rounded-md bg-indigo-600 text-white">Add to Watchlist</button>
              <button className="flex-1 py-3 rounded-md border border-slate-200">Details</button>
            </div>
          </div>
        </section>
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
