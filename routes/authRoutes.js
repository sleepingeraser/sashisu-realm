const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// public routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// protected route
router.get("/me", authMiddleware, authController.me);

module.exports = router;
