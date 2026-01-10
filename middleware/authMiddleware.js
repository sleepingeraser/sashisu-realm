const sessionModel = require("../models/sessionModel");
const { getPool, sql } = require("../config/dbConfig");

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Missing token" });

    const pool = await getPool();
    const result = await pool
      .request()
      .input("Token", sql.NVarChar(128), token)
      .query(
        `SELECT TOP 1 s.Token, s.UserId, s.ExpiresAt,
                u.Username, u.Email, u.Points
         FROM Sessions s
         JOIN Users u ON u.Id = s.UserId
         WHERE s.Token = @Token`
      );

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const row = result.recordset[0];
    const expiresAt = new Date(row.ExpiresAt);

    if (Date.now() > expiresAt.getTime()) {
      return res.status(401).json({ message: "Session expired" });
    }

    req.user = {
      id: row.UserId,
      username: row.Username,
      email: row.Email,
      points: row.Points,
      token: row.Token,
    };

    next();
  } catch (err) {
    console.error("authMiddleware error:", err);
    res.status(500).json({ message: "Auth error" });
  }
}

module.exports = authMiddleware;
