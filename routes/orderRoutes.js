const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

// create new order (with points or card payment)
router.post("/", authMiddleware, orderController.create);

// get user's orders
router.get("/", authMiddleware, orderController.listMine);

module.exports = router;
