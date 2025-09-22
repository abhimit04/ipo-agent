import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, TrendingUp, Star } from 'lucide-react';

export default function Landing() {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Header */}
      <header className="max-w-7xl mx-auto p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full p-2 shadow-md">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L15.09 8H21L16.45 11.97L18.54 18L12 14.02L5.46 18L7.55 11.97L3 8H8.91L12 2Z"
                fill="currentColor"
              />
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <section>
          <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl font-extrabold leading-tight">
            Track India IPOs with real-time GMP and data-driven advice
          </motion.h1>
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 text-lg text-slate-600">
            IPOWatch combines reliable IPO feeds, historical performance, and crowd‑sourced GMP to give a concise, no‑nonsense view. Integrated LLM summaries provide quick pros, cons, and suggested horizons.
          </motion.p>

          {/* Feature Cards */}
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

        {/* IPO Lists Section */}
        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold mb-4">Upcoming IPOs</h2>
          {loading ? <p>Loading...</p> :
            ipos.upcoming.length === 0 ? <p>No upcoming IPOs found.</p> :
            ipos.upcoming.map((ipo, idx) => (
              <div key={idx} className="p-4 bg-white rounded-lg shadow mb-3">
                <div className="font-semibold">{ipo.name}</div>
                <div className="text-sm text-slate-500">Open: {ipo.issueOpenDate} | Close: {ipo.issueCloseDate}</div>
              </div>
            ))
          }

          <h2 className="text-2xl font-semibold mb-4">Upcoming IPOs</h2>
                    {loading ? <p>Loading...</p> :
                      ipos.current.length === 0 ? <p>No current IPOs found.</p> :
                      ipos.current.map((ipo, idx) => (
                        <div key={idx} className="p-4 bg-white rounded-lg shadow mb-3">
                          <div className="font-semibold">{ipo.name}</div>
                          <div className="text-sm text-slate-500">Open: {ipo.issueOpenDate} | Close: {ipo.issueCloseDate}</div>
                        </div>
                      ))
                    }

          <h2 className="text-2xl font-semibold mt-6 mb-4">Listed IPO Performance</h2>
          {loading ? <p>Loading...</p> :
            ipos.listed.length === 0 ? <p>No listed IPOs found.</p> :
            ipos.listed.map((ipo, idx) => (
              <div key={idx} className="p-4 bg-white rounded-lg shadow mb-3">
                <div className="font-semibold">{ipo.name}</div>
                {ipo.performance ? (
                  <div className="text-sm text-slate-500">Listing Price: ₹{ipo.performance.firstClose} | Returns: {ipo.performance.returnsPct}%</div>
                ) : (
                  <div className="text-sm text-gray-400">Performance data not available</div>
                )}
              </div>
            ))
          }
        </section>
      </main>
    </div>
  );
}
