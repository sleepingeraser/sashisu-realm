require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();

// ---- CONFIG ----
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

// stripe secret key (server-side ONLY)
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("Missing STRIPE_SECRET_KEY in environment variables");
  process.exit(1);
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ---- MIDDLEWARE ----
app.use(
  cors({
    origin: CLIENT_ORIGIN === "*" ? true : CLIENT_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// ---- ROUTES ----
app.get("/", (req, res) => {
  res.send("Sashisu Realm Stripe API is running ✅");
});

// create paymentIntent (card only)
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, orderId, customerEmail } = req.body;

    // basic validation
    if (!Number.isInteger(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ error: "Invalid amount. Must be integer cents > 0." });
    }

    // Ssafety limit
    if (amount > 500000) {
      return res.status(400).json({ error: "Amount too large." });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "sgd",

      // card only, no redirects
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },

      metadata: {
        orderId: orderId || "N/A",
        customerEmail: customerEmail || "N/A",
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
