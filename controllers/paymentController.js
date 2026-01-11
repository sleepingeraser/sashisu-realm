const Stripe = require("stripe");
const productModel = require("../models/productModel");

// initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2023-10-16",
});

async function config(req, res) {
  console.log("📋 Config endpoint called");

  try {
    const publishableKey =
      process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_dummy";

    console.log("Environment:", process.env.NODE_ENV);
    console.log("Key exists:", !!publishableKey);

    res.json({
      success: true,
      publishableKey: publishableKey,
      currency: "jpy",
      environment: process.env.NODE_ENV || "development",
    });
  } catch (err) {
    console.error("Config error:", err);
    res.json({
      success: true,
      publishableKey: "pk_test_dummy",
      currency: "jpy",
      environment: "development",
    });
  }
}

async function createPaymentIntent(req, res) {
  console.log("💰 Creating payment intent for user:", req.user?.email);

  try {
    const { items, shippingCents = 318 } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // calculate total
    let subtotal = 0;
    for (const item of items) {
      const productId = String(item.productId || "");
      const qty = Number(item.qty || 1);

      if (!productId || qty <= 0) continue;

      const product = await productModel.getProductById(productId);
      if (!product) continue;

      subtotal += Number(product.PriceCents) * qty;
    }

    if (subtotal === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid items in cart",
      });
    }

    const shipping = Math.max(0, Number(shippingCents || 318));
    const total = subtotal + shipping;

    console.log("   Amount:", total, "cents (¥", total / 100, ")");

    // create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "jpy",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: String(req.user.id),
        userEmail: req.user.email,
      },
    });

    console.log("Payment Intent created:", paymentIntent.id);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
      currency: paymentIntent.currency,
    });
  } catch (err) {
    console.error("createPaymentIntent error:", err.message);

    res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: process.env.NODE_ENV === "production" ? undefined : err.message,
    });
  }
}

async function handleWebhook(req, res) {
  console.log("Webhook received");
  res.json({ received: true });
}

module.exports = {
  config,
  createPaymentIntent,
  handleWebhook,
};
