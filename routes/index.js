const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const paymentRoutes = require("./paymentRoutes");
const orderRoutes = require("./orderRoutes");

const authMiddleware = require("../middleware/authMiddleware");

router.get("/health", (req, res) => res.json({ ok: true }));

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/payments", paymentRoutes);
router.use("/orders", orderRoutes);

router.get("/me", authMiddleware, (req, res) => res.json(req.user));

module.exports = router;
