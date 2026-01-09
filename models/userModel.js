
const crypto = require("crypto");
const { getPool, sql } = require("../config/dbConfig");

function makeSalt() {
  return crypto.randomBytes(16).toString("hex");
}

function hashPassword(password, salt) {
  const hashed = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256");
  return hashed.toString("hex");
}

function timingSafeEqualHex(a, b) {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function findByEmail(email) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("Email", sql.NVarChar(255), email)
    .query(
      `SELECT TOP 1 Id, Username, Email, PasswordHash, Salt, Points
       FROM Users
       WHERE Email = @Email`
    );
  return result.recordset[0] || null;
}

async function createUser(username, email, password) {
  const pool = await getPool();

  const existing = await pool
    .request()
    .input("Email", sql.NVarChar(255), email)
    .query(`SELECT TOP 1 Id FROM Users WHERE Email = @Email`);

  if (existing.recordset.length > 0) return { error: "Email already exists" };

  const salt = makeSalt();
  const passwordHash = hashPassword(password, salt);

  const insert = await pool
    .request()
    .input("Username", sql.NVarChar(50), username)
    .input("Email", sql.NVarChar(255), email)
    .input("PasswordHash", sql.NVarChar(255), passwordHash)
    .input("Salt", sql.NVarChar(255), salt)
    .query(
      `INSERT INTO Users (Username, Email, PasswordHash, Salt, Points)
       OUTPUT INSERTED.Id
       VALUES (@Username, @Email, @PasswordHash, @Salt, 0)`
    );

  const id = insert.recordset[0].Id;
  return { id, username, email, points: 0 };
}

async function verifyLogin(email, password) {
  const user = await findByEmail(email);
  if (!user) return null;

  const hashed = hashPassword(password, user.Salt);
  if (!timingSafeEqualHex(hashed, user.PasswordHash)) return null;

  return {
    id: user.Id,
    username: user.Username,
    email: user.Email,
    points: user.Points,
  };
}

module.exports = { createUser, verifyLogin };
