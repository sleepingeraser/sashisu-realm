const userModel = require("../models/userModel");
const sessionModel = require("../models/sessionModel");

async function signup(req, res) {
  try {
    const { codename, username, email, password } = req.body || {};
    const name = (codename || username || "").trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const created = await userModel.createUser(name, email, password);
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
      return res.status(400).json({ message: "Missing email/password" });
    }

    const user = await userModel.verifyLogin(email, password);
    if (!user) {
      return res.status(401).json({ message: "Invalid email/password" });
    }

    // userModel returns { id, username, email, points }
    const session = await sessionModel.createSession(user.id);

    res.json({
      token: session.token,
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (e) {
    res.status(500).json({ message: "Login failed", error: e.message });
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { signup, login, me };
