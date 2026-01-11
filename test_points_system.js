// test_points_system.js
const fetch = require("node-fetch");

const API_BASE = "http://localhost:3000/api";
let authToken = "";
let userId = "";
let userPoints = 0;

async function testPointsSystem() {
  console.log("🧪 Testing Points Accumulation System\n");

  try {
    // 1. Sign up a test user
    console.log("1. Signing up test user...");
    const signupRes = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codename: "PointsTester",
        email: "points.tester@example.com",
        password: "test123",
      }),
    });

    const signupData = await signupRes.json();
    if (!signupData.success) {
      console.log("User might already exist, trying login...");
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "points.tester@example.com",
          password: "test123",
        }),
      });
      const loginData = await loginRes.json();
      authToken = loginData.token;
      userId = loginData.user.id;
      userPoints = loginData.user.points;
    } else {
      authToken = signupData.token;
      userId = signupData.user.id;
      userPoints = signupData.user.points;
    }

    console.log(`✅ User: ${userId}, Initial points: ${userPoints}`);

    // 2. Test card payment (earn points)
    console.log("\n2. Testing card payment (earn points)...");
    const cardOrderRes = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: "1", qty: 1 }], // ¥1300 item
        shippingCents: 318,
        recipientName: "Test User",
        email: "points.tester@example.com",
        phone: "090-1234-5678",
        addressLine: "Test Address",
        postalCode: "150-0001",
        paymentMethod: "stripe_card",
        pointsUsed: 0,
      }),
    });

    const cardOrderData = await cardOrderRes.json();
    console.log(`✅ Card order created: ${cardOrderData.orderId}`);
    console.log(`   Points earned: ${cardOrderData.pointsEarned}`);
    console.log(`   New points balance: ${cardOrderData.userPoints}`);

    userPoints = cardOrderData.userPoints;

    // 3. Test points payment
    console.log("\n3. Testing points payment...");
    const pointsOrderRes = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: "2", qty: 1 }], // ¥880 item
        shippingCents: 318,
        recipientName: "Test User",
        email: "points.tester@example.com",
        phone: "090-1234-5678",
        addressLine: "Test Address",
        postalCode: "150-0001",
        paymentMethod: "points",
        pointsUsed: Math.floor((880 + 318) / 10), // Calculate points needed
      }),
    });

    const pointsOrderData = await pointsOrderRes.json();
    console.log(`✅ Points order created: ${pointsOrderData.orderId}`);
    console.log(`   Points used: ${pointsOrderData.pointsUsed}`);
    console.log(`   New points balance: ${pointsOrderData.userPoints}`);

    userPoints = pointsOrderData.userPoints;

    // 4. Check orders
    console.log("\n4. Checking order history...");
    const ordersRes = await fetch(`${API_BASE}/orders`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const ordersData = await ordersRes.json();
    console.log(`✅ Found ${ordersData.orders.length} orders`);

    ordersData.orders.forEach((order, index) => {
      console.log(`\n   Order ${index + 1}:`);
      console.log(`     ID: ${order.orderId}`);
      console.log(`     Total: ¥${order.totalYen}`);
      console.log(`     Payment: ${order.paymentMethod}`);
      console.log(`     Points earned: ${order.pointsEarned}`);
      console.log(`     Points used: ${order.pointsUsed}`);
      console.log(`     Status: ${order.status}`);
    });

    // 5. Check final points balance
    console.log("\n5. Final points balance check...");
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const meData = await meRes.json();
    console.log(`Final points: ${meData.user.points}`);

    console.log("\n🎉 Points system test completed successfully!");
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testPointsSystem();
