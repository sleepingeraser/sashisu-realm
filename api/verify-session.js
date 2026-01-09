const Stripe = require("stripe");

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return res
        .status(500)
        .json({ error: "Missing STRIPE_SECRET_KEY in environment variables" });
    }

    const stripe = new Stripe(secretKey);

    const session_id = String(req.query?.session_id || "").trim();
    if (!session_id) {
      return res.status(400).json({ error: "Missing session_id" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    return res.status(200).json({
      id: session.id,
      payment_status: session.payment_status, // "paid" when completed
      amount_total: session.amount_total,
      currency: session.currency,
      livemode: session.livemode,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Failed to verify session",
      details: err?.message || String(err),
    });
  }
};
