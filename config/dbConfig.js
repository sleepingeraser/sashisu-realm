const sql = require("mssql");

const dbConfig = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "SashisuRealmDB",
  user: process.env.DB_USER || "SashisuRealm_user",
  password: process.env.DB_PASSWORD || "koyuki",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool;

async function getPool() {
  if (pool) return pool;

  try {
    pool = await sql.connect(dbConfig);
    console.log("✅ Connected to MSSQL");
    return pool;
  } catch (err) {
    console.error("❌ MSSQL connection failed:", err);
    throw err;
  }
}

module.exports = {
  sql,
  getPool,
};
