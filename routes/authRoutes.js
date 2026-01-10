const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// public routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// token validation endpoint
router.get("/validate", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Token is valid",
    user: req.user,
  });
});

// protected route
router.get("/me", authMiddleware, authController.me);

module.exports = router;
