const { getPool, sql } = require("../config/dbConfig");

async function getAllProducts() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT Id, Name, ImageUrl, PriceCents, Category, Tags
      FROM Products
      ORDER BY CAST(Id AS INT)
    `);

    // parse JSON tags
    const products = result.recordset.map((product) => ({
      ...product,
      tags: product.Tags ? JSON.parse(product.Tags) : [],
    }));

    return products;
  } catch (err) {
    console.error("Error getting products:", err);
    return [];
  }
}

async function getProductById(productId) {
  try {
    const pool = await getPool();
    const result = await pool.request().input("id", sql.NVarChar(50), productId)
      .query(`
        SELECT TOP 1 Id, Name, ImageUrl, PriceCents, Category, Tags
        FROM Products
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    const product = result.recordset[0];
    return {
      ...product,
      tags: product.Tags ? JSON.parse(product.Tags) : [],
    };
  } catch (err) {
    console.error("Error getting product by ID:", err);
    return null;
  }
}

module.exports = {
  getAllProducts,
  getProductById,
};
