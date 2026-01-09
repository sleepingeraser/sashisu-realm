const { getPool, sql } = require("../config/dbConfig");

async function getAllProducts() {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT Id, Name, ImageUrl, PriceCents, Category, Tags
     FROM Products
     ORDER BY TRY_CONVERT(int, Id), Id`
  );
  return result.recordset;
}

async function getProductById(productId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("Id", sql.NVarChar(50), productId)
    .query(
      `SELECT TOP 1 Id, Name, ImageUrl, PriceCents, Category, Tags
       FROM Products
       WHERE Id = @Id`
    );
  return result.recordset[0] || null;
}

module.exports = { getAllProducts, getProductById };
