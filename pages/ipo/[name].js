import { useRouter } from "next/router";
import { useEffect, useState } from "react";

// Financials table component
function FinancialsTable({ financials }) {
  if (!financials?.length) return <p>No financials available.</p>;
  return (
    <table className="min-w-full border border-gray-300 text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="border px-2 py-1">Period Ended</th>
          <th className="border px-2 py-1">Assets</th>
          <th className="border px-2 py-1">Total Income</th>
          <th className="border px-2 py-1">Profit After Tax</th>
          <th className="border px-2 py-1">EBITDA</th>
          <th className="border px-2 py-1">Net Worth</th>
          <th className="border px-2 py-1">Total Borrowing</th>
        </tr>
      </thead>
      <tbody>
        {financials.map((f, i) => (
          <tr key={i}>
            <td className="border px-2 py-1">{f.periodEnded}</td>
            <td className="border px-2 py-1">{f.assets}</td>
            <td className="border px-2 py-1">{f.totalIncome}</td>
            <td className="border px-2 py-1">{f.profitAfterTax}</td>
            <td className="border px-2 py-1">{f.ebitda}</td>
            <td className="border px-2 py-1">{f.netWorth}</td>
            <td className="border px-2 py-1">{f.totalBorrowing}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Parser to convert tab-separated financial string into array of objects
function parseFinancials(financialsStr) {
  if (!financialsStr) return [];
  const lines = financialsStr.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t").map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split("\t").map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      const key = h.toLowerCase().replace(/\s+/g, "").replace(/[^a-z]/g, "");
      obj[key] = values[i] || "";
    });
    return {
      periodEnded: obj.periodended,
      assets: obj.assets,
      totalIncome: obj.totalincome,
      profitAfterTax: obj.profitaftertax,
      ebitda: obj.ebitda,
      netWorth: obj.networth,
      totalBorrowing: obj.totalborrowing,
    };
  });
}


export default function IPODetailPage() {
  const router = useRouter();
  const { name } = router.query;
  const [ipo, setIpo] = useState(null);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    async function fetchIPO() {
      try {
        const res = await fetch(`/api/ipo/${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error("IPO not found");
        const data = await res.json();
        setIpo(data);
      } catch (err) {
        console.error("Error fetching IPO:", err);
        setIpo(null);
      }
    }

    fetchIPO();
  }, [router.isReady, name]);

  if (!ipo)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50">
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        {/* Loading text */}
        <p className="text-lg font-semibold text-blue-900 animate-pulse">
          Loading IPO details...
        </p>
      </div>
    );

  const financialsArray = ipo.financials
      ? ipo.financials
          .split("\n")
          .filter((row) => row.trim() !== "")
          .slice(1) // skip header if exists
          .map((row) => {
            const cols = row.split("\t"); // adjust delimiter if needed
            return {
              periodEnded: cols[0] || "-",
              assets: cols[1] || "-",
              totalIncome: cols[2] || "-",
              profitAfterTax: cols[3] || "-",
              ebitda: cols[4] || "-",
              netWorth: cols[5] || "-",
              totalBorrowing: cols[6] || "-",
            };
          })
      : [];


  return (
    <div className="p-6 space-y-6">
      {/* Box 1: Basic Info */}
      <div className="p-4 border rounded shadow-sm bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">IPO Details</h2>
        <p><strong>Name:</strong> {ipo.name}</p>
        <p><strong>Price Band:</strong> {ipo.priceBand}</p>
        <p><strong>Lot Size:</strong> {ipo.lotSize}</p>
        <p><strong>Issue Size:</strong> {ipo.issueSize}</p>
        <p><strong>Listing Date:</strong> {ipo.listingDate}</p>
        <p><strong>Tentative Allotment:</strong> {ipo.allotmentDate}</p>
        <p><strong>Initiation of Refunds:</strong> {ipo.refund}</p>
        <p><strong>Credit of Shares to Demat:</strong> {ipo.demat}</p>
        {ipo.gmp && <p><strong>GMP:</strong> {ipo.gmp}</p>}
        {ipo.gainPercent && <p><strong>Gain %:</strong> {ipo.gainPercent}</p>}
      </div>

      {/* Box 2: About */}
      <div className="p-4 border rounded shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-2">About the Company</h2>
              <p
                className={`whitespace-pre-line ${
                  aboutExpanded ? "" : "line-clamp-5"
                }`}
              >
                {ipo.about}
              </p>
              {ipo.about?.length > 300 && (
                <button
                  onClick={() => setAboutExpanded(!aboutExpanded)}
                  className="mt-2 text-blue-600 font-medium hover:underline"
                >
                  {aboutExpanded ? "Read less" : "Read more"}
                </button>
              )}
            </div>

      {/* Box 3: Financials */}
       <div className="p-4 border rounded shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-2">Company Financials</h2>
              <FinancialsTable financials={financialsArray} />
            </div>
    </div>
  );
}
