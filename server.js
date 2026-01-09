require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const apiRoutes = require("./routes");
const orderModel = require("./models/orderModel");
const { stripe } = require("./controllers/paymentController");

const app = express();

// stripe webhook MUST be raw (before express.json)
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } catch (err) {
      console.error("Webhook verify failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object;
        await orderModel.setOrderStatusByPaymentIntent(pi.id, "PAID");
      }

      if (event.type === "payment_intent.payment_failed") {
        const pi = event.data.object;
        await orderModel.setOrderStatusByPaymentIntent(pi.id, "FAILED");
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook handler error:", err);
      res.status(500).json({ message: "Webhook handler error" });
    }
  }
);

app.use(cors());
app.use(express.json());

// API routes
app.use("/api", apiRoutes);

// serve frontend from /public
app.use(express.static(path.join(__dirname, "public")));

// default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`)
);
