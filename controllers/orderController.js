const productModel = require("../models/productModel");
const orderModel = require("../models/orderModel");

async function create(req, res) {
  try {
    console.log("Creating order for user:", req.user.id);
    console.log("Request body:", req.body);

    const {
      items,
      shippingCents = 0,
      recipientName,
      email,
      phone,
      addressLine,
      postalCode,
      stripePaymentIntentId,
      paymentMethod = "stripe_card",
      pointsUsed = 0,
    } = req.body || {};

    // validation
    if (!recipientName || !email || !phone || !addressLine || !postalCode) {
      return res.status(400).json({
        success: false,
        message:
          "Missing delivery fields: name, email, phone, address, postal code",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items in order",
      });
    }

    // calculate order total
    let subtotal = 0;
    const normalized = [];

    for (const it of items) {
      const productId = String(it.productId || "");
      const qty = Number(it.qty || 0);

      if (!productId || qty <= 0) {
        console.log(`Skipping invalid item: ${productId}, qty: ${qty}`);
        continue;
      }

      const product = await productModel.getProductById(productId);
      if (!product) {
        console.log(`Product not found: ${productId}`);
        continue;
      }

      const itemTotal = Number(product.PriceCents) * qty;
      subtotal += itemTotal;

      normalized.push({
        productId,
        qty,
        unitPriceCents: Number(product.PriceCents),
      });

      console.log(
        `Added item: ${product.Name}, Price: ${product.PriceCents}, Qty: ${qty}, Total: ${itemTotal}`
      );
    }

    if (normalized.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid items in order",
      });
    }

    const ship = Math.max(0, Number(shippingCents || 0));
    const total = subtotal + ship;

    console.log(`Order calculation:`);
    console.log(`- Subtotal: ${subtotal} cents (¥${subtotal / 100})`);
    console.log(`- Shipping: ${ship} cents (¥${ship / 100})`);
    console.log(`- Total: ${total} cents (¥${total / 100})`);
    console.log(`- Payment method: ${paymentMethod}`);
    console.log(`- Points to use: ${pointsUsed}`);

    // validate points payment
    if (paymentMethod === "points") {
      // calculate points needed (10 yen = 1 point)
      const pointsNeeded = Math.floor(total / 1000);

      console.log(`Points payment validation:`);
      console.log(`- Total amount: ¥${total / 100}`);
      console.log(`- Points needed: ${pointsNeeded}`);
      console.log(`- Points provided: ${pointsUsed}`);
      console.log(`- User current points: ${req.user.points}`);

      if (pointsUsed !== pointsNeeded) {
        return res.status(400).json({
          success: false,
          message: `Points mismatch. Need ${pointsNeeded} points for ¥${
            total / 100
          } purchase`,
        });
      }

      if (req.user.points < pointsNeeded) {
        return res.status(400).json({
          success: false,
          message: `Insufficient points. Need ${pointsNeeded} but have ${req.user.points}`,
        });
      }
    }

    // create order
    const orderId = await orderModel.createOrder({
      userId: req.user.id,
      stripePaymentIntentId,
      status: paymentMethod === "points" ? "PAID" : "CREATED",
      subtotalCents: subtotal,
      shippingCents: ship,
      totalCents: total,
      recipientName,
      email,
      phone,
      addressLine,
      postalCode,
      items: normalized,
      paymentMethod,
      pointsUsed,
    });

    // get updated user points
    const updatedUserPoints = await orderModel.getUserPoints(req.user.id);

    const response = {
      success: true,
      orderId,
      status: paymentMethod === "points" ? "PAID" : "CREATED",
      totalYen: total / 100,
      pointsEarned:
        paymentMethod === "points" ? 0 : Math.floor(subtotal / 1000),
      pointsUsed,
      userPoints: updatedUserPoints,
      message:
        paymentMethod === "points"
          ? `Order paid with ${pointsUsed} points. Remaining points: ${updatedUserPoints}`
          : `Order created successfully. Earned ${Math.floor(
              subtotal / 1000
            )} points. Total points: ${updatedUserPoints}`,
    };

    console.log("Order creation response:", response);
    res.json(response);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({
      success: false,
      message: "Create order failed: " + err.message,
    });
  }
}

async function listMine(req, res) {
  try {
    console.log("Fetching orders for user:", req.user.id);

    const orders = await orderModel.listOrdersByUser(req.user.id);

    // format the response
    const formattedOrders = orders.map((order) => ({
      orderId: order.Id,
      status: order.Status,
      totalCents: order.TotalCents,
      subtotalCents: order.SubtotalCents,
      shippingCents: order.ShippingCents,
      paymentMethod: order.PaymentMethod,
      pointsEarned: order.PointsEarned,
      pointsUsed: order.PointsUsed,
      recipientName: order.RecipientName,
      createdAt: order.CreatedAt,
      // calculate yen values
      totalYen: order.TotalCents / 100,
      subtotalYen: order.SubtotalCents / 100,
      shippingYen: order.ShippingCents / 100,
    }));

    console.log(
      `Found ${formattedOrders.length} orders for user ${req.user.id}`
    );

    res.json({
      success: true,
      orders: formattedOrders,
    });
  } catch (err) {
    console.error("❌ List orders error:", err);
    res.status(500).json({
      success: false,
      message: "Fetch orders failed: " + err.message,
    });
  }
}

module.exports = { create, listMine };
