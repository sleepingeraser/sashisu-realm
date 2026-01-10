const Stripe = require("stripe");
const productModel = require("../models/productModel");
const orderModel = require("../models/orderModel");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// get publishable key
async function config(req, res) {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
}

// create payment intent
async function createPaymentIntent(req, res) {
  try {
    const { items, shippingCents = 0 } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Missing cart items" });
    }

    // calculate total
    let subtotal = 0;
    for (const item of items) {
      const productId = String(item.productId || "");
      const qty = Number(item.qty || 0);

      if (!productId || qty <= 0) continue;

      const product = await productModel.getProductById(productId);
      if (!product) continue;

      subtotal += Number(product.PriceCents) * qty;
    }

    if (subtotal === 0) {
      return res.status(400).json({ message: "No valid items" });
    }

    const shipping = Math.max(0, Number(shippingCents || 0));
    const total = subtotal + shipping;

    // create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "ypy",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: String(req.user.id),
        items: JSON.stringify(items),
        shippingCents: shipping,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
      currency: paymentIntent.currency,
    });
  } catch (err) {
    console.error("createPaymentIntent error:", err);
    res.status(500).json({
      message: "Failed to create payment intent",
      error: err.message,
    });
  }
}

// handle successful payment webhook
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

  // handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log("PaymentIntent was successful:", paymentIntent.id);

      // update order status in database
      try {
        await orderModel.setOrderStatusByPaymentIntent(
          paymentIntent.id,
          "PAID"
        );
        console.log(
          `Order for payment intent ${paymentIntent.id} marked as PAID`
        );
      } catch (err) {
        console.error("Failed to update order status:", err);
      }
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      console.log("Payment failed:", failedPayment.id);

      try {
        await orderModel.setOrderStatusByPaymentIntent(
          failedPayment.id,
          "FAILED"
        );
      } catch (err) {
        console.error("Failed to update failed payment status:", err);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}

module.exports = {
  config,
  createPaymentIntent,
  handleWebhook,
  stripe,
};
