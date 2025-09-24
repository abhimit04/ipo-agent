import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, TrendingUp, Star, Calendar, IndianRupee, Activity } from 'lucide-react';
import Link from "next/link";

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

  const TableSkeleton = () => (
    <div className="animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border-b border-slate-100">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6"></div>
        </div>
      ))}
    </div>
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `${day} ${month}`;
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f46e5' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto p-6 flex items-center justify-between backdrop-blur-sm bg-white/70 rounded-2xl m-4 shadow-lg border border-white/20">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl p-3 shadow-xl">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L15.09 8H21L16.45 11.97L18.54 18L12 14.02L5.46 18L7.55 11.97L3 8H8.91L12 2Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              IPOWatch
            </div>
            <div className="text-sm text-slate-600 font-medium">
              Track. Analyze. Advise.
            </div>
          </div>
        </div>

      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl font-bold leading-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent"
          >
            Track India IPOs with real-time GMP and data-driven advice
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-xl text-slate-600 leading-relaxed"
          >
            IPOWatch combines reliable IPO feeds, historical performance, and crowd‑sourced GMP to give a concise, no‑nonsense view. Integrated LLM summaries provide quick pros, cons, and suggested horizons.
          </motion.p>


        </div>
      </section>

      {/* IPO Tables Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Current IPOs */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50"
          >
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Current IPOs</h2>
              </div>
              <p className="text-sm text-slate-600">IPOs currently open for subscription</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <TableSkeleton />
              ) : (
                ipos.current?.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No current IPOs found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {ipos.current?.map((ipo, idx) => (
                      <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                        <Link href={`/ipo/${encodeURIComponent(ipo.name)}`}>
                                <a className="font-semibold text-slate-900 mb-1 hover:underline">{ipo.name}</a>
                         </Link>
                        <div className="text-sm text-slate-600 flex items-center gap-2">

                          Open: {ipo.issueOpenDate} | Close: {ipo.issueCloseDate} | Listing: {formatDate(ipo.listingDate) || 'TBD'}
                        </div>
                         <div className="text-sm text-slate-500">
                         Price Band: {ipo.priceBand?.replace(" per share", "") || "TBD"} | Lot Size:{" "}
                         {ipo.lotSize?.replace(" Shares", "") || "TBD"} | GMP:{" "}
                          <span
                           className={ipo.gmp && parseInt(ipo.gmp.replace(/[^\d]/g, "")) > 0
                                                      ? "blink-green font-semibold"
                                                      : "text-slate-400"}
                           >
                           {ipo.gmp ?? "N/A"}
                           </span>
                           </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </motion.div>

          {/* Upcoming IPOs */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50"
          >
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Upcoming IPOs</h2>
              </div>
              <p className="text-sm text-slate-600">IPOs scheduled to open soon</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <TableSkeleton />
              ) : (
                ipos.upcoming?.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming IPOs found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {ipos.upcoming?.map((ipo, idx) => (
                      <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                        <Link href={`/ipo/${encodeURIComponent(ipo.name)}`}>
                         <a className="font-semibold text-slate-900 mb-1 hover:underline">{ipo.name}</a>
                         </Link>
                        <div className="text-sm text-slate-600 flex items-center gap-2">

                          Open: {ipo.issueOpenDate} | Close: {ipo.issueCloseDate} | Listing: {formatDate(ipo.listingDate) || 'TBD'}
                        </div>
                        <div className="text-sm text-slate-500">
                          Price Band: {ipo.priceBand?.replace(" per share", "") || "TBD"} | Lot Size:{" "}
                          {ipo.lotSize?.replace(" Shares", "") || "TBD"} | GMP:{" "}
                          <span
                            className={ipo.gmp && parseInt(ipo.gmp.replace(/[^\d]/g, "")) > 0
                              ? "blink-green font-semibold"
                              : "text-slate-400"}
                          >
                            {ipo.gmp ?? "N/A"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </motion.div>

          {/* Listed IPO Performance */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50"
          >
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Listed Performance</h2>
              </div>
              <p className="text-sm text-slate-600">Performance of recently listed IPOs</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <TableSkeleton />
              ) : (
                ipos.listed?.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No listed IPOs found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {ipos.listed?.map((ipo, idx) => (
                      <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                        <Link href={`/ipo/${encodeURIComponent(ipo.name)}`}>
                         <a className="font-semibold text-slate-900 mb-1 hover:underline">{ipo.name}</a>
                         </Link>
                        {ipo.performance ? (
                          <div className="text-sm text-slate-600">
                            <div className="flex items-center gap-2 mb-1">
                              <IndianRupee className="w-4 h-4" />
                              Listing Price: ₹{ipo.performance.firstClose}
                            </div>
                            <div className={`flex items-center gap-2 ${ipo.performance.returnsPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              <TrendingUp className="w-4 h-4" />
                              Returns: {ipo.performance.returnsPct}%
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400">Performance data not available</div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Moved to Bottom */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 bg-white/50 backdrop-blur-sm rounded-2xl mx-4 mb-8 shadow-xl border border-white/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose IPOWatch?</h2>
          <p className="text-lg text-slate-600">Comprehensive IPO tracking with advanced analytics</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Search, title: "Real-time IPO list", desc: "Upcoming, open & listed IPOs from multiple sources.", color: "indigo" },
            { icon: TrendingUp, title: "Historical Performance", desc: "Listing returns, 1/3/6-month trends and charts.", color: "green" },
            { icon: Clock, title: "GMP Estimates", desc: "Crowd + scraped GMP signals (marked unofficial).", color: "amber" },
            { icon: Star, title: "LLM Insights", desc: "Short, audit‑friendly advice produced by an LLM.", color: "pink" }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 + idx * 0.1 }}
              className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 flex items-center justify-center mb-4 shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}