// sessionModel-fixed.js
const cryptoModule = require("crypto");
const { getPool, sql } = require("../config/dbConfig");

async function createSession(userId) {
  try {
    console.log(`Creating session for user ID: ${userId}`);

    const token = cryptoModule.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    console.log(`Generated token: ${token.substring(0, 20)}...`);
    console.log(`Expires at: ${expiresAt.toISOString()}`);

    const pool = await getPool();

    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .query(`DELETE FROM Sessions WHERE UserId = @UserId`);

    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("Token", sql.NVarChar(255), token)
      .input("ExpiresAt", sql.DateTime2, expiresAt).query(`
        INSERT INTO Sessions (UserId, Token, ExpiresAt, CreatedAt)
        VALUES (@UserId, @Token, @ExpiresAt, GETDATE())
      `);

    console.log(`Session saved to database for user ${userId}`);

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
      console.log(`Session found for user: ${result.recordset[0].UserId}`);
      return result.recordset[0];
    } else {
      console.log(`No valid session found for token`);
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
