const productModel = require("../models/productModel");
const orderModel = require("../models/orderModel");

async function create(req, res) {
  try {
    const {
      items,
      shippingCents = 0,
      recipientName,
      email,
      phone,
      addressLine,
      postalCode,
      stripePaymentIntentId,
    } = req.body || {};

    if (!recipientName || !email || !phone || !addressLine || !postalCode) {
      return res.status(400).json({ message: "Missing delivery fields" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Missing order items" });
    }

    let subtotal = 0;
    const normalized = [];

    for (const it of items) {
      const productId = String(it.productId || "");
      const qty = Number(it.qty || 0);
      if (!productId || qty <= 0) continue;

      const product = await productModel.getProductById(productId);
      if (!product) continue;

      subtotal += Number(product.PriceCents) * qty;
      normalized.push({
        productId,
        qty,
        unitPriceCents: Number(product.PriceCents),
      });
    }

    if (normalized.length === 0) {
      return res.status(400).json({ message: "No valid items" });
    }

    const ship = Math.max(0, Number(shippingCents || 0));
    const total = subtotal + ship;

    const orderId = await orderModel.createOrder({
      userId: req.user.id,
      stripePaymentIntentId,
      status: "CREATED",
      subtotalCents: subtotal,
      shippingCents: ship,
      totalCents: total,
      recipientName,
      email,
      phone,
      addressLine,
      postalCode,
      items: normalized,
    });

    res.json({ orderId, status: "CREATED" });
  } catch (err) {
    console.error("create order error:", err);
    res.status(500).json({ message: "Create order failed" });
  }
}

async function listMine(req, res) {
  try {
    const orders = await orderModel.listOrdersByUser(req.user.id);
    res.json({ orders });
  } catch (err) {
    console.error("list orders error:", err);
    res.status(500).json({ message: "Fetch orders failed" });
  }
}

module.exports = { create, listMine };
