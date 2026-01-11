const Stripe = require("stripe");
const productModel = require("../models/productModel");

// initialize Stripe with error handling
let stripe;
try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key", {
    apiVersion: "2023-10-16",
  });
  console.log("Stripe initialized");
} catch (err) {
  console.error("Stripe initialization error:", err.message);
  stripe = null;
}

async function config(req, res) {
  try {
    const publishableKey =
      process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_dummy_key";

    console.log("Stripe config requested");
    console.log("Publishable key exists:", !!publishableKey);
    console.log("Environment:", process.env.NODE_ENV || "development");

    res.json({
      success: true,
      publishableKey: publishableKey,
      currency: "jpy",
      environment: process.env.NODE_ENV || "development",
    });
  } catch (err) {
    console.error("Config error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get Stripe config",
      error: process.env.NODE_ENV === "production" ? undefined : err.message,
    });
  }
}

async function createPaymentIntent(req, res) {
  console.log("Creating payment intent...");
  console.log("User:", req.user?.email);
  console.log("Request body:", req.body);

  try {
    // check if Stripe is initialized
    if (!stripe) {
      throw new Error(
        "Stripe not initialized. Check STRIPE_SECRET_KEY environment variable."
      );
    }

    const { items, shippingCents = 318 } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // calculate total
    let subtotal = 0;
    const productDetails = [];

    for (const item of items) {
      const productId = String(item.productId || "");
      const qty = Number(item.qty || 1);

      if (!productId || qty <= 0) continue;

      const product = await productModel.getProductById(productId);
      if (!product) {
        console.log(`   Product ${productId} not found`);
        continue;
      }

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

    console.log("   Payment calculation:");
    console.log(`   - Subtotal: ${subtotal} cents (¥${subtotal / 100})`);
    console.log(`   - Shipping: ${shipping} cents (¥${shipping / 100})`);
    console.log(`   - Total: ${total} cents (¥${total / 100})`);
    console.log(`   - Points earned: ${Math.floor(subtotal / 10)}`);

    // create payment intent with JPY currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "jpy",
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
        pointsEarned: Math.floor(subtotal / 10).toString(),
      },
      description: `Order from ${req.user.email} - ${items.length} items`,
    });

    console.log("   ✅ Payment Intent created:", paymentIntent.id);
    console.log(
      "   ✅ Client Secret available:",
      !!paymentIntent.client_secret
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
        pointsEarned: Math.floor(subtotal / 10),
      },
    });
  } catch (err) {
    console.error("❌ createPaymentIntent error:", err.message);

    // provide helpful error messages
    let errorMessage = "Failed to create payment";
    if (err.type === "StripeInvalidRequestError") {
      errorMessage = "Invalid Stripe request. Check API keys.";
    } else if (err.code === "STRIPE_API_KEY_INVALID") {
      errorMessage = "Invalid Stripe API key. Please check configuration.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "production" ? undefined : err.message,
      details: err.type || "Unknown error",
    });
  }
}

async function handleWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!stripe) {
      throw new Error("Stripe not initialized");
    }

    if (!webhookSecret) {
      console.log(
        "STRIPE_WEBHOOK_SECRET not set, skipping signature verification"
      );
      event = req.body;
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`ℹWebhook received: ${event.type}`);

  switch (event.type) {
    case "payment_intent.succeeded":
      console.log("Payment succeeded:", event.data.object.id);
      // TODO: update order status in database
      break;
    case "payment_intent.payment_failed":
      console.log("Payment failed:", event.data.object.id);
      break;
    case "payment_intent.created":
      console.log("Payment intent created:", event.data.object.id);
      break;
    default:
      console.log(`ℹUnhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}

module.exports = {
  config,
  createPaymentIntent,
  handleWebhook,
  stripe,
};
