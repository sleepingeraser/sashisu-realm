const crypto = require("crypto");
const { getPool, sql } = require("../config/dbConfig");

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const pool = await getPool();
  await pool
    .request()
    .input("UserId", sql.Int, userId)
    .input("Token", sql.NVarChar(255), token)
    .input("ExpiresAt", sql.DateTime2, expiresAt).query(`
      INSERT INTO Sessions (UserId, Token, ExpiresAt)
      VALUES (@UserId, @Token, @ExpiresAt)
    `);

  return {
    token,
    expiresAt: expiresAt.toISOString(),
  };
}

async function findSession(token) {
  const pool = await getPool();
  const result = await pool.request().input("Token", sql.NVarChar(255), token)
    .query(`
      SELECT s.*, u.Id as UserId, u.Username, u.Email, u.Points
      FROM Sessions s
      JOIN Users u ON s.UserId = u.Id
      WHERE s.Token = @Token AND s.ExpiresAt > GETDATE()
    `);

  return result.recordset[0] || null;
}

module.exports = {
  createSession,
  findSession,
};
