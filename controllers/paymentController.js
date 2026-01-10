const Stripe = require("stripe");
const productModel = require("../models/productModel");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function config(req, res) {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
}

async function createPaymentIntent(req, res) {
  try {
    const { items, shippingCents = 0 } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Missing cart items" });
    }

    let subtotal = 0;
    const normalized = [];

    for (const it of items) {
      const productId = String(it.productId || "");
      const qty = Number(it.qty || 0);
      if (!productId || qty <= 0) continue;

      const product = await productModel.getProductById(productId);
      if (!product) continue;

      subtotal += Number(product.PriceCents) * qty;
      normalized.push({
        productId,
        qty,
        unitPriceCents: Number(product.PriceCents),
      });
    }

    if (normalized.length === 0) {
      return res.status(400).json({ message: "No valid items" });
    }

    const ship = Math.max(0, Number(shippingCents || 0));
    const total = subtotal + ship;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "sgd",
      automatic_payment_methods: { enabled: true },
      metadata: { userId: String(req.user.id) },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      breakdown: { subtotal, shipping: ship, total },
    });
  } catch (err) {
    console.error("createPaymentIntent error:", err);
    res.status(500).json({
      message: "Create PaymentIntent failed",
      error: err.message,
    });
  }
}

module.exports = { stripe, config, createPaymentIntent };
