const crypto = require("crypto");
const { getPool, sql } = require("../config/dbConfig");

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const pool = await getPool();
  await pool
    .request()
    .input("UserId", sql.Int, userId)
    .input("Token", sql.VarChar(255), token)
    .input("ExpiresAt", sql.DateTime2, expiresAt).query(`
      INSERT INTO Sessions (UserId, Token, ExpiresAt)
      VALUES (@UserId, @Token, @ExpiresAt)
    `);

  return { token, expiresAt };
}

async function findSession(token) {
  const pool = await getPool();
  const result = await pool.request().input("Token", sql.VarChar(255), token)
    .query(`
      SELECT TOP 1 *
      FROM Sessions
      WHERE Token=@Token AND ExpiresAt > GETDATE()
      ORDER BY ExpiresAt DESC
    `);

  return result.recordset[0] || null;
}

module.exports = { createSession, findSession };
