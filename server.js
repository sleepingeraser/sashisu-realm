require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// Mmddleware
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// import routes BEFORE static files
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    message: "Sashisu Realm API is running",
  });
});

// serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// catch-all route for frontend - MUST COME AFTER API ROUTES
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "API endpoint not found",
    });
  }

  // serve frontend HTML files
  res.sendFile(
    path.join(__dirname, "public", req.path === "/" ? "index.html" : req.path)
  );
});

// error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`API endpoints:`);
  console.log(`   - /api/health`);
  console.log(`   - /api/auth/*`);
  console.log(`   - /api/products/*`);
  console.log(`   - /api/orders/*`);
  console.log(`   - /api/payments/*`);
});
