require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const { sql, getPool } = require("./config/dbConfig");

const app = express();

// ---- CORS (lock to GitHub Pages + allow localhost for dev) ----
const allowList = [
  process.env.CLIENT_ORIGIN, // e.g. https://YOUR.github.io
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, cb) {
      // allow non-browser requests (like curl) with no origin
      if (!origin) return cb(null, true);
      if (allowList.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin));
    },
  })
);

app.use(express.json());

// ---- Stripe ----
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("⚠️ STRIPE_SECRET_KEY missing");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ---- helpers ----
function safeInt(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

// ---- health check ----
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// ---- products (your existing route) ----
// GET /api/products?offset=0&limit=9
app.get("/api/products", async (req, res) => {
  try {
    const offset = safeInt(req.query.offset, 0);
    const limitRaw = safeInt(req.query.limit, 9);
    const limit = clamp(limitRaw, 1, 30);

    const pool = await getPool();

    const countResult = await pool.request().query(`
      SELECT COUNT(*) AS total
      FROM Products
      WHERE IsActive = 1
    `);

    const total = countResult.recordset[0]?.total ?? 0;

    const request = pool.request();
    request.input("offset", sql.Int, offset);
    request.input("limit", sql.Int, limit);

    const itemsResult = await request.query(`
      SELECT
        Id AS id,
        Name AS name,
        Price AS price,
        Category AS category,
        Image AS image,
        Tags AS tags
      FROM Products
      WHERE IsActive = 1
      ORDER BY Id
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

    const products = (itemsResult.recordset || []).map((p) => {
      let tagsArr = [];
      try {
        const parsed = JSON.parse(p.tags);
        if (Array.isArray(parsed)) tagsArr = parsed;
      } catch {
        tagsArr = [];
      }

      let img = p.image || "";
      if (img && !img.startsWith("/")) img = "/" + img;

      return {
        id: p.id,
        name: p.name,
        price: Number(p.price || 0),
        category: p.category,
        image: img,
        tags: tagsArr,
      };
    });

    const hasMore = offset + products.length < total;

    res.json({ products, hasMore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---- Stripe PaymentIntent (API requirement) ----
// POST /api/create-payment-intent
// body: { amount: 1234 }  (amount in JPY since your UI is ¥)
app.post("/api/create-payment-intent", async (req, res) => {
  try {
    const amount = safeInt(req.body.amount, 0);

    if (!amount || amount < 1) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // currency: JPY matches your UI (¥). Stripe requires integer amounts.
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "jpy",
      automatic_payment_methods: { enabled: true },
      metadata: {
        app: "sashisu-realm",
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Stripe error" });
  }
});

// ---- start ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
