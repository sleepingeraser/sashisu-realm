const { getPool, sql } = require("../config/dbConfig");

async function authMiddleware(req, res, next) {
  try {
    console.log("🔒 Auth middleware checking...");

    const authHeader = req.headers.authorization || "";
    let token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (token) token = token.trim().replace(/^"+|"+$/g, ""); // ✅ add this

    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const pool = await getPool();

    // check if token exists at all
    const tokenCheck = await pool
      .request()
      .input("token", sql.NVarChar(255), token)
      .query(`SELECT * FROM Sessions WHERE Token = @token`);

    console.log(
      `Token exists in DB: ${
        tokenCheck.recordset.length > 0 ? "✅ Yes" : "❌ No"
      }`
    );

    if (tokenCheck.recordset.length === 0) {
      console.log("Token not found in Sessions table");
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Check if session exists and is valid
    const sessionResult = await pool
      .request()
      .input("token", sql.NVarChar(255), token).query(`
        SELECT TOP 1 s.*, u.Id as UserId, u.Username, u.Email, u.Points
        FROM Sessions s
        JOIN Users u ON s.UserId = u.Id
        WHERE s.Token = @token AND s.ExpiresAt > GETDATE()
      `);

    if (sessionResult.recordset.length === 0) {
      console.log("Invalid or expired session");

      // Check if expired
      const expiredCheck = await pool
        .request()
        .input("token", sql.NVarChar(255), token)
        .query(`SELECT ExpiresAt FROM Sessions WHERE Token = @token`);

      if (expiredCheck.recordset.length > 0) {
        console.log(`Token expired at: ${expiredCheck.recordset[0].ExpiresAt}`);
      }

      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const session = sessionResult.recordset[0];
    const user = {
      id: session.UserId,
      username: session.Username,
      email: session.Email,
      points: session.Points,
    };

    req.user = user;

    console.log(`✅ Auth successful for user: ${user.email}`);
    console.log(`User points: ${user.points}`);
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({
      success: false,
      message: "Authentication error",
      error: err.message,
    });
  }
}

module.exports = authMiddleware;
