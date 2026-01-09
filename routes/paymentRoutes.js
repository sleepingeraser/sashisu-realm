const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  config,
  createPaymentIntent,
} = require("../controllers/paymentController");

// handlers must be functions
router.get("/config", config);
router.post("/create-payment-intent", authMiddleware, createPaymentIntent);

module.exports = router;
