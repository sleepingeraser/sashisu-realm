require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { sql, getPool } = require("./config/dbConfig");

const app = express();

/* -------------------- CORS (locked to GitHub Pages) -------------------- */
const allowedOrigin = process.env.CLIENT_ORIGIN;

app.use(
  cors({
    origin: allowedOrigin, // only allow your GitHub Pages
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Optional: serve static files if you want
app.use(express.static("public"));

/* -------------------- Helpers -------------------- */
function safeInt(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function clampQty(qty) {
  const n = safeInt(qty, 1);
  if (n < 1) return 1;
  if (n > 99) return 99;
  return n;
}

/* -------------------- Stripe -------------------- */
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("⚠️ STRIPE_SECRET_KEY is missing in .env");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* -------------------- Health check -------------------- */
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

/* -------------------- Products API -------------------- */
/*
  GET /api/products?offset=0&limit=9
*/
app.get("/api/products", async (req, res) => {
  try {
    const offset = safeInt(req.query.offset, 0);
    const limitRaw = safeInt(req.query.limit, 9);
    const limit = Math.min(Math.max(limitRaw, 1), 30); // clamp 1..30

    const pool = await getPool();

    // total active products
    const countResult = await pool.request().query(`
      SELECT COUNT(*) AS total
      FROM Products
      WHERE IsActive = 1
    `);

    const total = countResult.recordset[0]?.total ?? 0;

    // paged products
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

/* -------------------- Stripe Payment API -------------------- */
/*
  POST /api/stripe/create-payment-intent
  Body:
  {
    "cartItems": [
      { "id": 1, "qty": 2 },
      { "id": 7, "qty": 1 }
    ]
  }

  Server calculates total from DB, then creates PaymentIntent.
*/
app.post("/api/stripe/create-payment-intent", async (req, res) => {
  try {
    const cartItems = Array.isArray(req.body.cartItems)
      ? req.body.cartItems
      : [];

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "cartItems is required" });
    }

    // normalize cart (id int, qty 1..99)
    const normalized = cartItems
      .map((it) => ({
        id: safeInt(it.id, 0),
        qty: clampQty(it.qty),
      }))
      .filter((it) => it.id > 0);

    if (normalized.length === 0) {
      return res.status(400).json({ error: "No valid cart items" });
    }

    const pool = await getPool();

    // We'll pass cart as JSON to SQL Server and join to Products.
    const cartJson = JSON.stringify(normalized);

    const request = pool.request();
    request.input("cartJson", sql.NVarChar(sql.MAX), cartJson);

    const result = await request.query(`
      DECLARE @cart NVARCHAR(MAX) = @cartJson;

      ;WITH Cart AS (
        SELECT
          id,
          qty
        FROM OPENJSON(@cart)
        WITH (
          id INT '$.id',
          qty INT '$.qty'
        )
      )
      SELECT
        p.Id AS id,
        CAST(p.Price AS FLOAT) AS price,
        c.qty AS qty
      FROM Cart c
      INNER JOIN Products p ON p.Id = c.id
      WHERE p.IsActive = 1
    `);

    const rows = result.recordset || [];
    if (rows.length === 0) {
      return res.status(400).json({ error: "No purchasable items found" });
    }

    // Calculate total
    let total = 0;
    for (const r of rows) {
      const price = Number(r.price || 0);
      const qty = clampQty(r.qty);
      total += price * qty;
    }

    // Convert to cents
    const amountInCents = Math.round(total * 100);

    if (amountInCents <= 0) {
      return res.status(400).json({ error: "Invalid total amount" });
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "sgd",
      automatic_payment_methods: { enabled: true }, // lets Stripe choose available methods (card still works)
      metadata: {
        app: "SashisuRealm",
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: amountInCents,
      currency: "sgd",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe server error" });
  }
});

/* -------------------- Start -------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
