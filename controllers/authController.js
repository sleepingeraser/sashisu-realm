const userModel = require("../models/userModel");
const sessionModel = require("../models/sessionModel");

async function signup(req, res) {
  try {
    const { codename, email, password } = req.body || {};

    if (!codename || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: codename, email, password",
      });
    }

    const created = await userModel.createUser(codename, email, password);

    if (created.error) {
      return res.status(409).json({
        success: false,
        message: created.error,
      });
    }

    const session = await sessionModel.createSession(created.id);

    res.json({
      success: true,
      token: session.token,
      user: {
        id: created.id,
        username: created.username,
        email: created.email,
        points: created.points,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({
      success: false,
      message: "Signup failed",
      error: err.message,
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing email or password",
      });
    }

    const user = await userModel.verifyLogin(email, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const session = await sessionModel.createSession(user.id);

    res.json({
      success: true,
      token: session.token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        points: user.points,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: err.message,
    });
  }
}

async function me(req, res) {
  res.json({
    success: true,
    user: req.user,
  });
}

module.exports = { signup, login, me };
