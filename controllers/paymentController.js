const Stripe = require("stripe");
const productModel = require("../models/productModel");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function config(req, res) {
  try {
    res.json({
      success: true,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      currency: "jpy", // Japanese Yen
    });
  } catch (err) {
    console.error("Config error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get Stripe config",
    });
  }
}

async function createPaymentIntent(req, res) {
  console.log("Creating payment intent...");
  console.log("User:", req.user);
  console.log("Request body:", req.body);

  try {
    const { items, shippingCents = 318 } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Calculate total
    let subtotal = 0;
    const productDetails = [];

    for (const item of items) {
      const productId = String(item.productId || "");
      const qty = Number(item.qty || 1);

      if (!productId || qty <= 0) continue;

      const product = await productModel.getProductById(productId);
      if (!product) continue;

      const itemTotal = Number(product.PriceCents) * qty;
      subtotal += itemTotal;

      productDetails.push({
        productId,
        name: product.Name,
        quantity: qty,
        unitPrice: product.PriceCents,
        total: itemTotal,
      });
    }

    if (subtotal === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid items in cart",
      });
    }

    const shipping = Math.max(0, Number(shippingCents || 318));
    const total = subtotal + shipping;

    console.log("Payment calculation:");
    console.log("- Subtotal:", subtotal, "cents (¥", subtotal / 100, ")");
    console.log("- Shipping:", shipping, "cents (¥", shipping / 100, ")");
    console.log("- Total:", total, "cents (¥", total / 100, ")");
    console.log(
      "- Points earned from this purchase:",
      Math.floor(subtotal / 1000)
    );

    // create payment intent with JPY currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "jpy", // Japanese Yen
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: String(req.user.id),
        userEmail: req.user.email,
        itemsCount: items.length.toString(),
        subtotal: subtotal.toString(),
        shipping: shipping.toString(),
        total: total.toString(),
        pointsEarned: Math.floor(subtotal / 1000).toString(),
      },
      description: `Order from ${req.user.email} - ${items.length} items`,
    });

    console.log("Payment Intent created:", paymentIntent.id);
    console.log(
      "Client Secret:",
      paymentIntent.client_secret ? "Present" : "Missing"
    );

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
      currency: paymentIntent.currency,
      breakdown: {
        subtotal,
        shipping,
        total,
        pointsEarned: Math.floor(subtotal / 1000),
      },
    });
  } catch (err) {
    console.error("❌ createPaymentIntent error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: err.message,
      details: err.type || "Unknown error",
    });
  }
}

async function handleWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      console.log("Payment succeeded:", event.data.object.id);
      // can update order status here
      break;
    case "payment_intent.payment_failed":
      console.log("Payment failed:", event.data.object.id);
      break;
    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}

module.exports = {
  config,
  createPaymentIntent,
  handleWebhook,
  stripe,
};
