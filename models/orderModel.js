
const crypto = require("crypto");
const { getPool, sql } = require("../config/dbConfig");

function makeOrderId() {
  return "ord_" + crypto.randomBytes(12).toString("hex");
}

async function createOrder({
  userId,
  stripePaymentIntentId,
  status,
  subtotalCents,
  shippingCents,
  totalCents,
  recipientName,
  email,
  phone,
  addressLine,
  postalCode,
  items, // [{ productId, qty, unitPriceCents }]
}) {
  const pool = await getPool();
  const orderId = makeOrderId();

  await pool
    .request()
    .input("Id", sql.NVarChar(80), orderId)
    .input("UserId", sql.Int, userId)
    .input("StripePI", sql.NVarChar(100), stripePaymentIntentId || null)
    .input("Status", sql.NVarChar(30), status)
    .input("SubtotalCents", sql.Int, subtotalCents)
    .input("ShippingCents", sql.Int, shippingCents)
    .input("TotalCents", sql.Int, totalCents)
    .input("PaymentMethod", sql.NVarChar(30), "stripe_card")
    .input("RecipientName", sql.NVarChar(120), recipientName)
    .input("Email", sql.NVarChar(255), email)
    .input("Phone", sql.NVarChar(50), phone)
    .input("AddressLine", sql.NVarChar(255), addressLine)
    .input("PostalCode", sql.NVarChar(30), postalCode)
    .query(
      `INSERT INTO Orders
       (Id, UserId, StripePaymentIntentId, Status, SubtotalCents, ShippingCents, TotalCents, PaymentMethod,
        RecipientName, Email, Phone, AddressLine, PostalCode)
       VALUES
       (@Id, @UserId, @StripePI, @Status, @SubtotalCents, @ShippingCents, @TotalCents, @PaymentMethod,
        @RecipientName, @Email, @Phone, @AddressLine, @PostalCode)`
    );

  for (const it of items) {
    await pool
      .request()
      .input("OrderId", sql.NVarChar(80), orderId)
      .input("ProductId", sql.NVarChar(50), it.productId)
      .input("Qty", sql.Int, it.qty)
      .input("UnitPriceCents", sql.Int, it.unitPriceCents)
      .query(
        `INSERT INTO OrderItems (OrderId, ProductId, Qty, UnitPriceCents)
         VALUES (@OrderId, @ProductId, @Qty, @UnitPriceCents)`
      );
  }

  return orderId;
}

async function listOrdersByUser(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("UserId", sql.Int, userId)
    .query(
      `SELECT Id, Status, SubtotalCents, ShippingCents, TotalCents, CreatedAt
       FROM Orders
       WHERE UserId = @UserId
       ORDER BY CreatedAt DESC`
    );
  return result.recordset;
}

async function setOrderStatusByPaymentIntent(paymentIntentId, status) {
  const pool = await getPool();
  await pool
    .request()
    .input("StripePI", sql.NVarChar(100), paymentIntentId)
    .input("Status", sql.NVarChar(30), status)
    .query(
      `UPDATE Orders
       SET Status = @Status
       WHERE StripePaymentIntentId = @StripePI`
    );
}

module.exports = {
  createOrder,
  listOrdersByUser,
  setOrderStatusByPaymentIntent,
};
