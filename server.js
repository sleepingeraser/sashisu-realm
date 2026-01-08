import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { allProducts } from "./api/productsData.js";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend from /public
app.use(express.static(path.join(__dirname, "public")));

// API endpoint
app.get("/api/products", (req, res) => {
  const offset = Number(req.query.offset ?? 0);
  const limit = Number(req.query.limit ?? 9);

  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 9;

  const slice = allProducts.slice(safeOffset, safeOffset + safeLimit);

  res.json({
    products: slice,
    hasMore: safeOffset + safeLimit < allProducts.length,
  });
});

// nice default
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log("Running on port", PORT));
