import handlerIPOs from "../ipos"; // reuse your ipos.js handler logic

export default async function handler(req, res) {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: "Missing IPO name" });
  }

  try {
    // Call your /api/ipos handler to get all IPOs
    const mockRes = {
      status: () => mockRes,
      json: (data) => (mockRes.data = data),
    };
    await handlerIPOs({ query: {} }, mockRes);
    const { upcoming, current, listed } = mockRes.data;

    const allIPOs = [...upcoming, ...current, ...listed];
    const ipo = allIPOs.find(
      (i) => i.name.toLowerCase() === decodeURIComponent(name).toLowerCase()
    );

    if (!ipo) return res.status(404).json({ error: "IPO not found" });

    res.status(200).json(ipo);
  } catch (err) {
    console.error("Error in single IPO fetch:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
