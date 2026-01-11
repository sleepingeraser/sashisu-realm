const express = require("express");
const router = express.Router();

// import all route files
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const paymentRoutes = require("./paymentRoutes");
const orderRoutes = require("./orderRoutes");

// mount routes
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/payments", paymentRoutes);
router.use("/orders", orderRoutes);

// health check endpoint
router.get("/health", (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    message: "API is healthy",
  });
});

module.exports = router;
