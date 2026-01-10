const crypto = require("crypto");
const { getPool, sql } = require("../config/dbConfig");

function makeSalt() {
  return crypto.randomBytes(16).toString("hex");
}

function hashPassword(password, salt) {
  const hashed = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512");
  return hashed.toString("hex");
}

function verifyPassword(password, salt, storedHash) {
  const hashedAttempt = hashPassword(password, salt);
  return crypto.timingSafeEqual(
    Buffer.from(hashedAttempt, "hex"),
    Buffer.from(storedHash, "hex")
  );
}

async function findByEmail(email) {
  const pool = await getPool();
  const result = await pool.request().input("email", sql.NVarChar(255), email)
    .query(`
      SELECT Id, Username, Email, PasswordHash, Salt, Points
      FROM Users 
      WHERE Email = @email
    `);

  return result.recordset[0] || null;
}

async function createUser(username, email, password) {
  const pool = await getPool();

  // heck if user exists
  const existing = await pool
    .request()
    .input("email", sql.NVarChar(255), email)
    .query(`SELECT Id FROM Users WHERE Email = @email`);

  if (existing.recordset.length > 0) {
    return { error: "Email already exists" };
  }

  // create new user
  const salt = makeSalt();
  const passwordHash = hashPassword(password, salt);

  const result = await pool
    .request()
    .input("username", sql.NVarChar(50), username)
    .input("email", sql.NVarChar(255), email)
    .input("passwordHash", sql.NVarChar(255), passwordHash)
    .input("salt", sql.NVarChar(255), salt).query(`
      INSERT INTO Users (Username, Email, PasswordHash, Salt, Points)
      OUTPUT INSERTED.Id, INSERTED.Username, INSERTED.Email, INSERTED.Points
      VALUES (@username, @email, @passwordHash, @salt, 0)
    `);

  const newUser = result.recordset[0];
  return {
    id: newUser.Id,
    username: newUser.Username,
    email: newUser.Email,
    points: newUser.Points,
  };
}

async function verifyLogin(email, password) {
  const user = await findByEmail(email);
  if (!user) return null;

  const isValid = verifyPassword(password, user.Salt, user.PasswordHash);
  if (!isValid) return null;

  return {
    id: user.Id,
    username: user.Username,
    email: user.Email,
    points: user.Points,
  };
}

module.exports = {
  createUser,
  verifyLogin,
  findByEmail,
};
