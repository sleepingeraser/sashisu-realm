require("dotenv").config();

const express = require("express");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

app.use(express.json());

// If your frontend is served from the same server, put HTML/CSS/JS in /public
// app.use(express.static(path.join(__dirname, "public")));

// API routes (match your frontend fetch paths)
app.use("/api", authRoutes); // /api/signup, /api/login, /api/me
app.use("/api/products", productRoutes); // GET /api/products
app.use("/api/orders", orderRoutes); // GET/POST /api/orders (protected)
app.use("/api/payments", paymentRoutes); // /api/payments/config, /api/payments/create-payment-intent

// health check
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
