require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { sql, getPool } = require("./config/dbConfig");

const app = express();

app.use(cors());
app.use(express.json());

// serve your frontend from /public
app.use(express.static("public"));

function safeInt(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

// health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// check if server is running
app.get("/", (req, res) => {
  res.send(`
    <h1>Server is running! ✅</h1>
    <p><a href="/api/health">Check health</a></p>
    <p><a href="/api/products">View products API</a></p>
  `);
});

// GET /api/products?offset=0&limit=9
app.get("/api/products", async (req, res) => {
  try {
    const offset = safeInt(req.query.offset, 0);
    const limitRaw = safeInt(req.query.limit, 9);
    const limit = Math.min(Math.max(limitRaw, 1), 30); // clamp 1..30

    const pool = await getPool();
    console.log("Database connected successfully");

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
      // tags is stored as a JSON string like ["aot","uno"]
      let tagsArr = [];
      try {
        const parsed = JSON.parse(p.tags);
        if (Array.isArray(parsed)) tagsArr = parsed;
      } catch {
        tagsArr = [];
      }

      // normalize image to start with /
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
