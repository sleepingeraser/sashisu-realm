const crypto = require("crypto");
const { getPool, sql } = require("../config/dbConfig");

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function createSession(userId) {
  const token = createToken();
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const pool = await getPool();
  await pool
    .request()
    .input("Token", sql.NVarChar(128), token)
    .input("UserId", sql.Int, userId)
    .input("ExpiresAt", sql.DateTime2, expires)
    .query(
      `INSERT INTO Sessions (Token, UserId, ExpiresAt)
       VALUES (@Token, @UserId, @ExpiresAt)`
    );

  return { token, expiresAt: expires.toISOString() };
}

module.exports = { createSession };
