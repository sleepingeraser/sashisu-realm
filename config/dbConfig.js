// config/dbConfig.js
const sql = require("mssql");

let pool;

async function getPool() {
  if (pool) return pool;

  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
      encrypt: true, // keep true for hosted DBs
      trustServerCertificate: true, // allow local/self-signed certs
    },
  };

  pool = await sql.connect(config);
  return pool;
}

module.exports = { sql, getPool };
