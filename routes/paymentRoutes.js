const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

// GET stripe publishable key (no auth required)
router.get("/config", paymentController.config);

// POST create payment intent (requires auth)
router.post(
  "/create-payment-intent",
  authMiddleware,
  paymentController.createPaymentIntent
);

// POST stripe webhook (no auth, raw body)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

module.exports = router;
