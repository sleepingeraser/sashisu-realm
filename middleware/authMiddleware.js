const { getPool, sql } = require("../config/dbConfig");

async function authMiddleware(req, res, next) {
  try {
    console.log("Auth middleware checking...");
    console.log("Headers:", req.headers);

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    console.log(
      "Token received:",
      token ? `Yes (${token.substring(0, 10)}...)` : "No"
    );

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const pool = await getPool();

    // check if session exists and is valid
    const sessionResult = await pool
      .request()
      .input("token", sql.NVarChar(255), token).query(`
        SELECT TOP 1 s.* 
        FROM Sessions s
        WHERE s.Token = @token AND s.ExpiresAt > GETDATE()
      `);

    if (sessionResult.recordset.length === 0) {
      console.log("Invalid or expired session");
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // get user details
    const userResult = await pool
      .request()
      .input("userId", sql.Int, sessionResult.recordset[0].UserId).query(`
        SELECT Id, Username, Email, Points
        FROM Users
        WHERE Id = @userId
      `);

    if (userResult.recordset.length === 0) {
      console.log("User not found");
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.recordset[0];
    req.user = {
      id: user.Id,
      username: user.Username,
      email: user.Email,
      points: user.Points,
    };

    console.log("Auth successful for user:", user.Email);
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
