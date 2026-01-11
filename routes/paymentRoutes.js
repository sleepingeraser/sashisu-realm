const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

// GET stripe publishable key
router.get("/config", (req, res) => {
  console.log("Payment config endpoint called");
  paymentController.config(req, res);
});

// POST create payment intent
router.post("/create-payment-intent", authMiddleware, (req, res) => {
  console.log("💰 Create payment intent endpoint called");
  paymentController.createPaymentIntent(req, res);
});

// POST stripe webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    console.log("🔔 Webhook endpoint called");
    paymentController.handleWebhook(req, res);
  }
);

module.exports = router;
