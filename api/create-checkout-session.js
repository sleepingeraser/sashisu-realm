const Stripe = require("stripe");

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return res
        .status(500)
        .json({ error: "Missing STRIPE_SECRET_KEY in environment variables" });
    }

    const stripe = new Stripe(secretKey);

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const cart = Array.isArray(body?.cart) ? body.cart : [];
    const deliveryFee = Number(body?.deliveryFee || 0);
    const currency = (body?.currency || "jpy").toLowerCase(); // your site uses ¥, so JPY fits

    if (!cart.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // frontend origin (works for Vercel deployments)
    const origin =
      req.headers.origin ||
      `https://${req.headers.host}` ||
      "http://localhost:3000";

    // convert cart -> stripe line_items
    const line_items = cart.map((item) => {
      const name = String(item?.name || "Item");
      const qty = Math.max(Number(item?.qty || 1), 1);
      const unit_amount = Math.max(Math.round(Number(item?.price || 0)), 0); // JPY must be integer

      return {
        quantity: qty,
        price_data: {
          currency,
          unit_amount,
          product_data: {
            name,
          },
        },
      };
    });

    // add delivery fee as a line item
    if (deliveryFee > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency,
          unit_amount: Math.round(deliveryFee),
          product_data: { name: "Delivery Fee" },
        },
      });
    }

    // ceate stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: `${origin}/confirmed.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout.html?cancelled=1`,
      // metadata is useful for your assignment writeup (server-side tracking)
      metadata: {
        app: "Sashisu Realm",
        orderId: String(body?.orderId || ""),
      },
    });

    return res.status(200).json({
      id: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Failed to create checkout session",
      details: err?.message || String(err),
    });
  }
};
