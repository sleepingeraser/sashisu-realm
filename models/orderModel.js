const crypto = require("crypto");
const { getPool, sql } = require("../config/dbConfig");

function makeOrderId() {
  return "ord_" + crypto.randomBytes(12).toString("hex");
}

async function createOrder({
  userId,
  stripePaymentIntentId,
  status = "CREATED",
  subtotalCents,
  shippingCents,
  totalCents,
  recipientName,
  email,
  phone,
  addressLine,
  postalCode,
  items,
  paymentMethod = "stripe_card",
  pointsUsed = 0,
}) {
  const pool = await getPool();
  const orderId = makeOrderId();
  const transaction = pool.transaction();

  try {
    await transaction.begin();

    // Calculate points earned from this purchase (10 yen = 1 point, 1 yen = 100 cents)
    const pointsEarnedFromPurchase =
      paymentMethod === "points" ? 0 : Math.floor(subtotalCents / 1000);

    console.log(`Creating order for user ${userId}`);
    console.log(`- Payment method: ${paymentMethod}`);
    console.log(`- Subtotal: ${subtotalCents} cents`);
    console.log(`- Points used: ${pointsUsed}`);
    console.log(`- Points earned: ${pointsEarnedFromPurchase}`);

    // 1. educt points if using points payment
    if (paymentMethod === "points" && pointsUsed > 0) {
      console.log(
        `Attempting to deduct ${pointsUsed} points from user ${userId}`
      );

      const pointsResult = await transaction
        .request()
        .input("UserId", sql.Int, userId)
        .input("PointsUsed", sql.Int, pointsUsed).query(`
          UPDATE Users 
          SET Points = Points - @PointsUsed
          OUTPUT INSERTED.Points as NewPoints
          WHERE Id = @UserId AND Points >= @PointsUsed
        `);

      if (pointsResult.recordset.length === 0) {
        throw new Error(
          `Insufficient points. User ${userId} tried to use ${pointsUsed} points`
        );
      }

      console.log(
        `Successfully deducted ${pointsUsed} points from user ${userId}`
      );
      console.log(
        `   New points balance: ${pointsResult.recordset[0].NewPoints}`
      );
    }

    // 2. create the order
    await transaction
      .request()
      .input("Id", sql.NVarChar(80), orderId)
      .input("UserId", sql.Int, userId)
      .input("StripePI", sql.NVarChar(100), stripePaymentIntentId || null)
      .input(
        "Status",
        sql.NVarChar(30),
        paymentMethod === "points" ? "PAID" : "CREATED"
      )
      .input("SubtotalCents", sql.Int, subtotalCents)
      .input("ShippingCents", sql.Int, shippingCents)
      .input("TotalCents", sql.Int, totalCents)
      .input("PaymentMethod", sql.NVarChar(30), paymentMethod)
      .input("PointsEarned", sql.Int, pointsEarnedFromPurchase)
      .input("PointsUsed", sql.Int, pointsUsed)
      .input("RecipientName", sql.NVarChar(120), recipientName)
      .input("Email", sql.NVarChar(255), email)
      .input("Phone", sql.NVarChar(50), phone)
      .input("AddressLine", sql.NVarChar(255), addressLine)
      .input("PostalCode", sql.NVarChar(30), postalCode).query(`
        INSERT INTO Orders
        (Id, UserId, StripePaymentIntentId, Status, SubtotalCents, ShippingCents, TotalCents,
         PaymentMethod, PointsEarned, PointsUsed,
         RecipientName, Email, Phone, AddressLine, PostalCode, CreatedAt)
        VALUES
        (@Id, @UserId, @StripePI, @Status, @SubtotalCents, @ShippingCents, @TotalCents,
         @PaymentMethod, @PointsEarned, @PointsUsed,
         @RecipientName, @Email, @Phone, @AddressLine, @PostalCode, GETDATE())
      `);

    // 3. add order items
    for (const it of items) {
      await transaction
        .request()
        .input("OrderId", sql.NVarChar(80), orderId)
        .input("ProductId", sql.NVarChar(50), it.productId)
        .input("Qty", sql.Int, it.qty)
        .input("UnitPriceCents", sql.Int, it.unitPriceCents).query(`
          INSERT INTO OrderItems (OrderId, ProductId, Qty, UnitPriceCents, CreatedAt)
          VALUES (@OrderId, @ProductId, @Qty, @UnitPriceCents, GETDATE())
        `);
    }

    // 4. add points earned from purchase (only for non-points payments)
    if (pointsEarnedFromPurchase > 0) {
      console.log(
        `Adding ${pointsEarnedFromPurchase} points to user ${userId}`
      );

      await transaction
        .request()
        .input("UserId", sql.Int, userId)
        .input("PointsEarned", sql.Int, pointsEarnedFromPurchase).query(`
          UPDATE Users 
          SET Points = Points + @PointsEarned
          WHERE Id = @UserId
        `);

      console.log(
        `✅ Added ${pointsEarnedFromPurchase} points to user ${userId}`
      );
    }

    await transaction.commit();
    console.log(`✅ Order ${orderId} created successfully`);
    console.log(
      `   Payment: ${paymentMethod}, Points used: ${pointsUsed}, Points earned: ${pointsEarnedFromPurchase}`
    );

    return orderId;
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Transaction failed:", err);
    throw err;
  }
}

async function listOrdersByUser(userId) {
  const pool = await getPool();
  const result = await pool.request().input("UserId", sql.Int, userId).query(`
      SELECT 
        Id, 
        Status, 
        SubtotalCents, 
        ShippingCents, 
        TotalCents,
        PaymentMethod,
        PointsEarned,
        PointsUsed,
        RecipientName,
        CreatedAt
      FROM Orders
      WHERE UserId = @UserId
      ORDER BY CreatedAt DESC
    `);
  return result.recordset;
}

async function setOrderStatusByPaymentIntent(paymentIntentId, status) {
  const pool = await getPool();
  await pool
    .request()
    .input("StripePI", sql.NVarChar(100), paymentIntentId)
    .input("Status", sql.NVarChar(30), status).query(`
      UPDATE Orders
      SET Status = @Status
      WHERE StripePaymentIntentId = @StripePI
    `);
}

// helper function to get user points
async function getUserPoints(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("UserId", sql.Int, userId)
    .query(`SELECT Points FROM Users WHERE Id = @UserId`);
  return result.recordset[0]?.Points || 0;
}

module.exports = {
  createOrder,
  listOrdersByUser,
  setOrderStatusByPaymentIntent,
  getUserPoints,
};
