const userModel = require("../models/userModel");
const sessionModel = require("../models/sessionModel");

async function signup(req, res) {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const created = await userModel.createUser(username, email, password);
    if (created.error) return res.status(409).json({ message: created.error });

    const session = await sessionModel.createSession(created.id);

    res.json({
      token: session.token,
      expiresAt: session.expiresAt,
      user: created,
    });
  } catch (err) {
    console.error("signup error:", err);
    res.status(500).json({ message: "Signup failed" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await userModel.verifyLogin(email, password);
    if (!user) return res.status(401).json({ message: "Invalid login" });

    const session = await sessionModel.createSession(user.id);

    res.json({
      token: session.token,
      expiresAt: session.expiresAt,
      user,
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { signup, login, me };
