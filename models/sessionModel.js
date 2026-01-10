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
const crypto = require("crypto");
const { getPool, sql } = require("../config/dbConfig");

async function createSession(userId) {
  try {
    console.log(`Creating session for user ID: ${userId}`);

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    console.log(`Generated token: ${token.substring(0, 20)}...`);
    console.log(`Expires at: ${expiresAt.toISOString()}`);

    const pool = await getPool();

    // Delete any existing sessions for this user first (optional)
    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .query(`DELETE FROM Sessions WHERE UserId = @UserId`);

    // Insert new session
    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("Token", sql.NVarChar(255), token)
      .input("ExpiresAt", sql.DateTime2, expiresAt).query(`
        INSERT INTO Sessions (UserId, Token, ExpiresAt, CreatedAt)
        VALUES (@UserId, @Token, @ExpiresAt, GETDATE())
      `);

    console.log(`✅ Session saved to database for user ${userId}`);

    // Verify it was saved
    const verifyResult = await pool
      .request()
      .input("Token", sql.NVarChar(255), token)
      .query(`SELECT * FROM Sessions WHERE Token = @Token`);

    console.log(
      `Session verification: ${
        verifyResult.recordset.length > 0 ? "✅ Found" : "❌ Not found"
      }`
    );

    return {
      token,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (err) {
    console.error("Failed to create session:", err);
    throw err;
  }
}

async function findSession(token) {
  try {
    console.log(`Looking for session with token: ${token.substring(0, 20)}...`);

    const pool = await getPool();
    const result = await pool.request().input("Token", sql.NVarChar(255), token)
      .query(`
        SELECT s.*, u.Id as UserId, u.Username, u.Email, u.Points
        FROM Sessions s
        JOIN Users u ON s.UserId = u.Id
        WHERE s.Token = @Token AND s.ExpiresAt > GETDATE()
      `);

    if (result.recordset.length > 0) {
      console.log(`✅ Session found for user: ${result.recordset[0].UserId}`);
      return result.recordset[0];
    } else {
      console.log(`No valid session found for token`);

      // Debug: Check if token exists but expired
      const expiredCheck = await pool
        .request()
        .input("Token", sql.NVarChar(255), token)
        .query(`SELECT * FROM Sessions WHERE Token = @Token`);

      if (expiredCheck.recordset.length > 0) {
        console.log(
          `ℹ️ Token exists but expired at: ${expiredCheck.recordset[0].ExpiresAt}`
        );
      }

      return null;
    }
  } catch (err) {
    console.error("Error finding session:", err);
    return null;
  }
}

module.exports = {
  createSession,
  findSession,
};
