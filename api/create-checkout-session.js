const Stripe = require("stripe");

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function safeJson(body) {
  if (!body) return {};
  if (typeof body === "object") return body;
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    res.status(500).json({ error: "Missing STRIPE_SECRET_KEY in env" });
    return;
  }

  const stripe = new Stripe(secret);

  const body = safeJson(req.body);
  const items = Array.isArray(body.items) ? body.items : [];
  const deliveryFee = Number(body.deliveryFee || 0);
  const orderId = String(body.orderId || "");
  const deliveryDetails = body.deliveryDetails || {};

  if (!items.length) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  // where to send user back after Stripe:
  // works for GitHub Pages → Vercel because browser sends Origin header.
  const origin =
    req.headers.origin || process.env.SITE_URL || "http://localhost:3000";

  // build stripe line items (JPY uses smallest unit = yen, no decimals)
  const line_items = items.map((it) => {
    const name = String(it.name || "Item");
    const unit_amount = Math.max(0, Math.round(Number(it.price || 0)));
    const quantity = Math.max(1, Math.round(Number(it.qty || 1)));

    return {
      price_data: {
        currency: "jpy",
        product_data: { name },
        unit_amount
      },
      quantity
    };
  });

  if (deliveryFee > 0) {
    line_items.push({
      price_data: {
        currency: "jpy",
        product_data: { name: "Delivery Fee" },
        unit_amount: Math.max(0, Math.round(deliveryFee))
      },
      quantity: 1
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${origin}/confirmed.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout.html`,
      metadata: {
        orderId,
        fullName: String(deliveryDetails.fullName || ""),
        postalCode: String(deliveryDetails.postalCode || "")
      }
    });

    res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    res.status(500).json({
      error: "Stripe session create failed",
      details: err && err.message ? err.message : String(err)
    });
  }
};
