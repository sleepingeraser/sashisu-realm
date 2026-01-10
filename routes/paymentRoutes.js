const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  config,
  createPaymentIntent,
} = require("../controllers/paymentController");

router.get("/config", config);
router.post("/create-payment-intent", createPaymentIntent);

module.exports = router;
