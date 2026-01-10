// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// ---------- middlewares ----------
app.use(cors());
app.use(express.json());

// serve frontend files from a folder like "public"
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

// ---------- routes ----------
app.get("/", (req, res) => res.json({ message: "Sashisu Realm API running" }));

app.use("/api", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// ---------- fallback ----------
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ---------- start server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
