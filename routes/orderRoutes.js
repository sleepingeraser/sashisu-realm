const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const orderController = require("../controllers/orderController");

router.post("/", authMiddleware, orderController.create);
router.get("/", authMiddleware, orderController.listMine);

module.exports = router;
