const userModel = require("../models/userModel");
const sessionModel = require("../models/sessionModel");

async function signup(req, res) {
  try {
    console.log("📝 Signup request received");
    console.log("Body:", req.body);

    const { codename, email, password } = req.body || {};

    if (!codename || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: codename, email, password",
      });
    }

    console.log(`Creating user: ${codename}, ${email}`);
    const created = await userModel.createUser(codename, email, password);

    if (created.error) {
      return res.status(409).json({
        success: false,
        message: created.error,
      });
    }

    console.log(`User created successfully: ${created.id}`);
    console.log(`Creating session for user: ${created.id}`);

    const session = await sessionModel.createSession(created.id);

    console.log(
      `Session created with token: ${session.token.substring(0, 20)}...`
    );

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
    console.error("❌ Signup error:", err);
    res.status(500).json({
      success: false,
      message: "Signup failed",
      error: err.message,
    });
  }
}

async function login(req, res) {
  try {
    console.log("🔑 Login request received");
    console.log("Body:", req.body);

    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing email or password",
      });
    }

    console.log(`Verifying login for: ${email}`);
    const user = await userModel.verifyLogin(email, password);

    if (!user) {
      console.log(`❌ Invalid credentials for: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log(`✅ Login successful for user: ${user.id}`);
    console.log(`Creating session for user: ${user.id}`);

    const session = await sessionModel.createSession(user.id);

    console.log(
      `✅ Session created with token: ${session.token.substring(0, 20)}...`
    );
    console.log(`Token expires at: ${session.expiresAt}`);

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
    console.error("❌ Login error:", err);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: err.message,
    });
  }
}

async function me(req, res) {
  console.log("👤 Me request for user:", req.user);
  res.json({
    success: true,
    user: req.user,
  });
}

module.exports = { signup, login, me };
