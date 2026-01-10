const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/config", paymentController.config);
router.post(
  "/create-payment-intent",
  authMiddleware,
  paymentController.createPaymentIntent
);

module.exports = router;
