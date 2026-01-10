// ============ configuration ============
const API_BASE = "http://localhost:3000/api";

// ============ global variables ============
let stripe;
let elements;
let cardElement;

// ============ token management ============
function getAuthToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found in localStorage");
    return null;
  }

  console.log("Token found:", token.substring(0, 20) + "...");
  return token;
}

function checkAuth() {
  const token = getAuthToken();
  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// ============ initialize stripe ============
async function initializeStripe() {
  try {
    console.log("Initializing Stripe...");

    // check auth first
    if (!checkAuth()) return;

    // get publishable key from backend
    const response = await fetch(`${API_BASE}/payments/config`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to get Stripe config");
    }

    console.log("Got publishable key");

    // initialize Stripe
    stripe = Stripe(data.publishableKey);

    // initialize Elements
    elements = stripe.elements();

    // create card element
    const style = {
      base: {
        color: "#ffffff",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#a0a0a0",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    };

    // mount card element
    cardElement = elements.create("card", {
      style: style,
      hidePostalCode: true,
    });

    cardElement.mount("#card-element");

    // handle real-time validation errors
    cardElement.on("change", function (event) {
      const displayError = document.getElementById("card-errors");
      if (event.error) {
        displayError.textContent = event.error.message;
      } else {
        displayError.textContent = "";
      }
    });

    console.log("Stripe initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
    document.getElementById("card-errors").textContent =
      "Payment system initialization failed. Please refresh the page.";
  }
}

// ============ test token function ============
async function testToken() {
  try {
    const token = getAuthToken();
    if (!token) return false;

    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log("Token test response:", data);

    if (data.success) {
      console.log("Token is valid for user:", data.user.email);
      return true;
    } else {
      console.log("Token invalid:", data.message);
      // clear invalid token
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
      return false;
    }
  } catch (error) {
    console.error("Token test failed:", error);
    return false;
  }
}

// ============ payment processing ============
async function handlePayment() {
  const cardError = document.getElementById("card-errors");
  const sealBtn = document.getElementById("sealOrderBtn");

  try {
    // disable button and show loading
    sealBtn.disabled = true;
    sealBtn.textContent = "Processing...";
    cardError.textContent = "";

    // test token before proceeding
    const tokenValid = await testToken();
    if (!tokenValid) {
      throw new Error("Your session has expired. Please login again.");
    }

    // 1. validate cart
    const cart = getCart();
    if (!cart.length) {
      throw new Error("Your cart is empty");
    }

    // 2. validate delivery info
    const delivery = getDeliveryData();
    const deliveryErr = validateDelivery(delivery);
    if (deliveryErr) {
      throw new Error(deliveryErr);
    }

    // 3. get auth token
    const token = getAuthToken();
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    // 4. format items for backend
    const items = cart.map((item) => ({
      productId: String(item.id),
      qty: Number(item.qty || 1),
    }));

    console.log("Sending payment request with items:", items);
    console.log("Using token:", token.substring(0, 20) + "...");

    // 5. create payment intent on backend
    const response = await fetch(`${API_BASE}/payments/create-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: items,
        shippingCents: 318,
      }),
    });

    // log response status
    console.log("Response status:", response.status);

    const responseText = await response.text();
    console.log("Raw response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
      throw new Error("Invalid response from server");
    }

    console.log("Payment intent response:", data);

    if (!data.success) {
      throw new Error(data.message || "Payment setup failed");
    }

    if (!data.clientSecret) {
      throw new Error("No client secret received from server");
    }

    // 6. confirm card payment
    const { paymentIntent, error } = await stripe.confirmCardPayment(
      data.clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: delivery.fullName || "Customer",
            email: getUserEmailFromStorage() || "customer@example.com",
            phone: delivery.phone || "",
            address: {
              line1: delivery.address1 || "",
              line2: delivery.address2 || "",
              city: delivery.city || "",
              state: delivery.prefecture || "",
              postal_code: delivery.postalCode || "",
              country: "JP",
            },
          },
        },
        return_url: window.location.origin + "/confirmed.html",
      }
    );

    if (error) {
      console.error("Stripe error:", error);
      throw new Error(error.message);
    }

    console.log("Payment intent result:", paymentIntent);

    if (paymentIntent.status === "succeeded") {
      console.log("Payment succeeded:", paymentIntent.id);

      // 7. create order in database
      await createOrder(paymentIntent.id, delivery, items, token);

      // 8. clear cart
      localStorage.setItem("cart", JSON.stringify([]));
      updateHeaderCartCount();

      // 9. redirect to success page
      window.location.href = `confirmed.html?payment_intent=${paymentIntent.id}&success=true`;
    } else {
      throw new Error(`Payment status: ${paymentIntent.status}`);
    }
  } catch (error) {
    console.error("Payment failed:", error);
    cardError.textContent = error.message;
    sealBtn.disabled = false;
    sealBtn.textContent = "Seal Order";
  }
}

// ============ create rrder in database ============
async function createOrder(paymentIntentId, delivery, items, token) {
  try {
    const userEmail = getUserEmailFromStorage();

    const orderData = {
      stripePaymentIntentId: paymentIntentId,
      recipientName: delivery.fullName,
      email: userEmail,
      phone: delivery.phone,
      addressLine: buildAddressLine(delivery),
      postalCode: delivery.postalCode,
      items: items,
      shippingCents: 318,
    };

    console.log("Creating order with data:", orderData);

    const response = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();
    console.log("Order creation response:", data);

    // store order in localStorage for display
    if (data.orderId) {
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      orders.push({
        orderId: data.orderId,
        status: "PAID",
        total: calculateCartTotal() + 318,
        pointsEarned: Math.floor(calculateCartTotal() / 10),
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("orders", JSON.stringify(orders));
    }
  } catch (error) {
    console.error("Failed to create order:", error);
  }
}

// ============ helper functions ============
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
}

function calculateCartTotal() {
  const cart = getCart();
  return cart.reduce((total, item) => {
    return total + Number(item.price || 0) * Number(item.qty || 1);
  }, 0);
}

function updateHeaderCartCount() {
  const cart = getCart();
  const totalQty = cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
  const el = document.getElementById("cartCount");
  if (el) el.textContent = totalQty;
}

function getDeliveryData() {
  return {
    fullName: document.getElementById("fullName")?.value.trim(),
    phone: document.getElementById("phone")?.value.trim(),
    postalCode: document.getElementById("postalCode")?.value.trim(),
    address1: document.getElementById("address1")?.value.trim(),
    address2: document.getElementById("address2")?.value.trim(),
    city: document.getElementById("city")?.value.trim(),
    prefecture: document.getElementById("prefecture")?.value.trim(),
  };
}

function validateDelivery(d) {
  if (!d.fullName) return "Full Name is required.";
  if (!d.phone) return "Phone is required.";
  if (!d.postalCode) return "Postal Code is required.";
  if (!d.address1) return "Address Line 1 is required.";
  if (!d.city) return "City is required.";
  if (!d.prefecture) return "Prefecture is required.";
  return null;
}

function buildAddressLine(d) {
  const parts = [d.address1, d.address2, d.city, d.prefecture].filter(Boolean);
  return parts.join(", ");
}

function getUserEmailFromStorage() {
  try {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    return user.email || "";
  } catch {
    return "";
  }
}

// ============ initialize ============
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Checkout page loaded");

  // update cart display
  renderTotals();
  updateHeaderCartCount();

  // check if user is logged in
  if (!checkAuth()) return;

  // test token immediately
  const tokenValid = await testToken();
  if (!tokenValid) {
    alert("Your session has expired. Please login again.");
    window.location.href = "login.html";
    return;
  }

  // initialize Stripe
  await initializeStripe();

  // handle payment button click
  const sealBtn = document.getElementById("sealOrderBtn");
  if (sealBtn) {
    sealBtn.addEventListener("click", handlePayment);
  }

  // initialize side menu
  const sideMenu = document.getElementById("sideMenu");
  const menuBtn = document.getElementById("menuBtn");
  const closeMenuBtn = document.getElementById("closeMenuBtn");

  if (menuBtn && sideMenu) {
    menuBtn.addEventListener("click", () => {
      sideMenu.classList.remove("translate-x-[-110%]");
      sideMenu.classList.add("translate-x-0");
    });
  }

  if (closeMenuBtn && sideMenu) {
    closeMenuBtn.addEventListener("click", () => {
      sideMenu.classList.add("translate-x-[-110%]");
      sideMenu.classList.remove("translate-x-0");
    });
  }
});

// render order totals
function renderTotals() {
  const cart = getCart();

  const emptyMsg = document.getElementById("emptyMsg");
  const detailsCard = document.querySelector(".details");
  const sealBtn = document.getElementById("sealOrderBtn");

  if (!cart.length) {
    if (detailsCard) detailsCard.classList.add("hidden");
    if (emptyMsg) emptyMsg.classList.remove("hidden");
    if (sealBtn) sealBtn.disabled = true;
    return;
  }

  if (detailsCard) detailsCard.classList.remove("hidden");
  if (emptyMsg) emptyMsg.classList.add("hidden");
  if (sealBtn) sealBtn.disabled = false;

  const itemsTotal = calculateCartTotal();
  const deliveryFee = 318;
  const totalYen = itemsTotal + deliveryFee;
  const points = Math.floor(itemsTotal / 10);

  if (document.getElementById("itemsTotal")) {
    document.getElementById("itemsTotal").textContent = formatYen(itemsTotal);
  }
  if (document.getElementById("deliveryFee")) {
    document.getElementById("deliveryFee").textContent = formatYen(deliveryFee);
  }
  if (document.getElementById("totalYen")) {
    document.getElementById("totalYen").textContent = formatYen(totalYen);
  }
  if (document.getElementById("pointsEarned")) {
    document.getElementById("pointsEarned").textContent = `+${points}`;
  }
}

function formatYen(amount) {
  return `¥${Number(amount).toLocaleString()}`;
}
