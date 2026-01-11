require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// middleware
app.use(
  cors({
    origin: [
      "https://sleepingeraser.github.io",
      "https://YOUR-FRONTEND-RENDER.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// serve frontend files from root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/browse.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "browse.html"));
});

app.get("/checkout.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "checkout.html"));
});

// health check
app.get("/health", (req, res) => res.json({ ok: true }));

// error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
