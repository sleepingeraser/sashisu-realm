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

    // Create the order
    await transaction
      .request()
      .input("Id", sql.NVarChar(80), orderId)
      .input("UserId", sql.Int, userId)
      .input("StripePI", sql.NVarChar(100), stripePaymentIntentId || null)
      .input("Status", sql.NVarChar(30), "PAID") // Set to PAID immediately for points payment
      .input("SubtotalCents", sql.Int, subtotalCents)
      .input("ShippingCents", sql.Int, shippingCents)
      .input("TotalCents", sql.Int, totalCents)
      .input("PaymentMethod", sql.NVarChar(30), paymentMethod)
      .input("RecipientName", sql.NVarChar(120), recipientName)
      .input("Email", sql.NVarChar(255), email)
      .input("Phone", sql.NVarChar(50), phone)
      .input("AddressLine", sql.NVarChar(255), addressLine)
      .input("PostalCode", sql.NVarChar(30), postalCode).query(`
        INSERT INTO Orders
        (Id, UserId, StripePaymentIntentId, Status, SubtotalCents, ShippingCents, TotalCents, PaymentMethod,
         RecipientName, Email, Phone, AddressLine, PostalCode, CreatedAt)
        VALUES
        (@Id, @UserId, @StripePI, @Status, @SubtotalCents, @ShippingCents, @TotalCents, @PaymentMethod,
         @RecipientName, @Email, @Phone, @AddressLine, @PostalCode, GETDATE())
      `);

    // Deduct points if using points payment
    if (paymentMethod === "points" && pointsUsed > 0) {
      const pointsResult = await transaction
        .request()
        .input("UserId", sql.Int, userId)
        .input("PointsUsed", sql.Int, pointsUsed).query(`
          UPDATE Users 
          SET Points = Points - @PointsUsed
          OUTPUT INSERTED.Points
          WHERE Id = @UserId AND Points >= @PointsUsed
        `);

      if (pointsResult.recordset.length === 0) {
        throw new Error("Insufficient points or user not found");
      }

      console.log(`Deducted ${pointsUsed} points from user ${userId}`);
    }

    // Add order items
    for (const it of items) {
      await transaction
        .request()
        .input("OrderId", sql.NVarChar(80), orderId)
        .input("ProductId", sql.NVarChar(50), it.productId)
        .input("Qty", sql.Int, it.qty)
        .input(
          "UnitPriceCents",
          sql.Int,
          it.unitPriceCents || it.unitPriceCents
        ).query(`
          INSERT INTO OrderItems (OrderId, ProductId, Qty, UnitPriceCents, CreatedAt)
          VALUES (@OrderId, @ProductId, @Qty, @UnitPriceCents, GETDATE())
        `);
    }

    // Add points earned from purchase (only for non-points payments)
    if (paymentMethod !== "points") {
      const pointsEarned = Math.floor(subtotalCents / 100); // 100 cents = 1 point
      if (pointsEarned > 0) {
        await transaction
          .request()
          .input("UserId", sql.Int, userId)
          .input("PointsEarned", sql.Int, pointsEarned).query(`
            UPDATE Users 
            SET Points = Points + @PointsEarned
            WHERE Id = @UserId
          `);
        console.log(`Added ${pointsEarned} points to user ${userId}`);
      }
    }

    await transaction.commit();
    console.log(`Order ${orderId} created successfully`);

    return orderId;
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction failed:", err);
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

module.exports = {
  createOrder,
  listOrdersByUser,
  setOrderStatusByPaymentIntent,
};
