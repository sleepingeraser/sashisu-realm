const { getPool, sql } = require("../config/dbConfig");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const pool = await getPool();
    const result = await pool.request().input("token", sql.NVarChar(255), token)
      .query(`
        SELECT s.*, u.Id as userId, u.Username, u.Email, u.Points
        FROM Sessions s
        JOIN Users u ON s.UserId = u.Id
        WHERE s.Token = @token AND s.ExpiresAt > GETDATE()
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const session = result.recordset[0];
    req.user = {
      id: session.userId,
      username: session.Username,
      email: session.Email,
      points: session.Points,
      token: session.Token,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ message: "Authentication error" });
  }
}

module.exports = authMiddleware;
