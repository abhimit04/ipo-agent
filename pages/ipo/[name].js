import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function IPODetailPage() {
  const router = useRouter();
  const { name } = router.query;
  const [ipo, setIpo] = useState(null);

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
        {ipo.gmp && <p><strong>GMP:</strong> {ipo.gmp}</p>}
        {ipo.gainPercent && <p><strong>Gain %:</strong> {ipo.gainPercent}</p>}
      </div>

      {/* Box 2: About */}
      <div className="p-4 border rounded shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-2">About the Company</h2>
        <p className="whitespace-pre-line">{ipo.company?.about}</p>
      </div>

      {/* Box 3: Financials */}
      <div className="p-4 border rounded shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-2">Company Financials</h2>
        <p className="whitespace-pre-line">{ipo.financials}</p>
      </div>
    </div>
  );
}
