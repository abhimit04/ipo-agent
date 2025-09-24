import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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

  if (!ipo) return <p>Loading IPO details...</p>;

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
      {/* Box 3: Financials in table */}
      <div className="p-4 border rounded shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-2">Company Financials</h2>
        {ipo.financials ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {ipo.financials
                    .split("\n")[0]
                    .split(/\t| {2,}/)
                    .map((header, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-2 text-left text-sm font-medium text-gray-700"
                      >
                        {header}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ipo.financials
                  .split("\n")
                  .slice(1)
                  .map((row, idx) => (
                    <tr key={idx}>
                      {row
                        .split(/\t| {2,}/)
                        .map((cell, cidx) => (
                          <td key={cidx} className="px-4 py-2 text-sm text-gray-700">
                            {cell}
                          </td>
                        ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No financial data available.</p>
        )}
      </div>

    </div>
  );
}
