import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function IPODetail() {
  const router = useRouter();
  const { name } = router.query;
  const [ipoData, setIpoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState("");

  useEffect(() => {
    if (!name) return;

    async function fetchIPO() {
      try {
        // 1. Fetch IPO details from your API
        const res = await fetch(`/api/ipo-details?name=${encodeURIComponent(name)}`);
        const data = await res.json();
        setIpoData(data);

        // 2. Fetch AI summary
        const summaryRes = await fetch(`/api/ipo-ai-summary?name=${encodeURIComponent(name)}`);
        const summary = await summaryRes.json();
        setAiSummary(summary.text);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchIPO();
  }, [name]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!ipoData) return <div className="p-8 text-center">IPO not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
      <h1 className="text-3xl font-bold mb-4">{ipoData.name}</h1>

      {/* IPO Details */}
      <section className="mb-6">
        <h2 className="font-semibold text-xl mb-2">IPO Details</h2>
        <ul className="text-slate-700">
          {Object.entries(ipoData).map(([key, value]) => (
            <li key={key}><strong>{key}:</strong> {value || "TBD"}</li>
          ))}
        </ul>
      </section>

      {/* Company Info & Financials */}
      <section className="mb-6">
        <h2 className="font-semibold text-xl mb-2">Company Info & Financials</h2>
        <div className="text-slate-700">
          <p>{ipoData.companyDescription}</p>
          <ul>
            {ipoData.financials?.map((item, idx) => (
              <li key={idx}>{item.metric}: {item.value}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* AI Summary */}
      <section>
        <h2 className="font-semibold text-xl mb-2">AI Summary of Feedback</h2>
        <p className="text-slate-700">{aiSummary}</p>
      </section>
    </div>
  );
}
