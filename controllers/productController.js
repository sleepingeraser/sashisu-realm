const productModel = require("../models/productModel");

async function getAll(req, res) {
  try {
    const rows = await productModel.getAllProducts();
    res.json({ products: rows });
  } catch (err) {
    console.error("products getAll error:", err);
    res.status(500).json({ message: "Products fetch failed" });
  }
}

module.exports = { getAll };
