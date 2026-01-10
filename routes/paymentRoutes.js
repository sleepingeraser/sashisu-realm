const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

// GET publishable key
router.get("/config", paymentController.config);

// POST create payment intent (requires auth)
router.post(
  "/create-payment-intent",
  authMiddleware,
  paymentController.createPaymentIntent
);

// POST Stripe webhook (no auth, raw body)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

module.exports = router;
