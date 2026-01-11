// ============ configuration ============
const API_BASE = `${window.location.origin}/api`;

// ============ global variables ============
let stripe;
let elements;
let cardElement;
let currentPaymentMethod = "card"; // 'card' or 'points'
let userPoints = 0;
let orderTotalYen = 0;
let orderTotalPoints = 0;
let isCardValid = false;
let isDeliveryFormValid = false;

// ============ token management ============
function getAuthToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No valid token found in localStorage");
    return null;
  }
  return token;
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
        isCardValid = false;
      } else {
        displayError.textContent = "";
        isCardValid = event.complete || false;
      }
      updatePaymentButtonState();
    });

    console.log("Stripe initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
    document.getElementById("card-errors").textContent =
      "Payment system initialization failed. Please refresh the page.";
    isCardValid = false;
    updatePaymentButtonState();
  }
}

// ============ fetch user points ============
async function fetchUserPoints() {
  try {
    const token = getAuthToken();
    if (!token) return 0;

    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success && data.user) {
      return data.user.points || 0;
    }
    return 0;
  } catch (error) {
    console.error("Failed to fetch user points:", error);
    return 0;
  }
}

// ============ update points display ============
function updatePointsDisplay() {
  const pointsNeeded = Math.floor(orderTotalYen / 10); // 10 yen = 1 point

  // Update displays
  document.getElementById("userPoints").textContent =
    userPoints.toLocaleString();
  document.getElementById("orderPointsNeeded").textContent =
    pointsNeeded.toLocaleString();

  // Calculate progress
  const progressPercentage = Math.min((userPoints / pointsNeeded) * 100, 100);
  const pointsProgressBar = document.getElementById("pointsProgressBar");
  const pointsProgressText = document.getElementById("pointsProgressText");
  const pointsStatus = document.getElementById("pointsStatus");
  const usePointsBtn = document.getElementById("usePointsBtn");
  const pointsMessage = document.getElementById("pointsMessage");

  // Update progress bar
  if (pointsProgressBar) {
    pointsProgressBar.style.width = `${progressPercentage}%`;
  }

  // Update progress text
  if (pointsProgressText) {
    pointsProgressText.textContent = `${Math.min(
      userPoints,
      pointsNeeded
    ).toLocaleString()}/${pointsNeeded.toLocaleString()}`;
  }

  // Update status and button
  if (userPoints >= pointsNeeded) {
    pointsStatus.textContent = "✅ Sufficient Points";
    pointsStatus.className = "text-lg font-semibold text-green-400";

    if (usePointsBtn) {
      usePointsBtn.disabled = false;
      usePointsBtn.innerHTML =
        '<i class="fa-solid fa-bolt mr-2"></i>Pay with Points';
    }

    if (pointsMessage) {
      pointsMessage.innerHTML = `
        <i class="fa-solid fa-check-circle mr-2 text-green-400"></i>
        You have enough points to pay for this order!
        <span class="block text-white/70 text-xs mt-1">
          Remaining points after payment: <span class="font-semibold">${(
            userPoints - pointsNeeded
          ).toLocaleString()}</span>
        </span>
      `;
      pointsMessage.className =
        "mt-4 text-sm p-3 rounded-lg bg-green-900/20 border border-green-500/30";
    }
  } else {
    pointsStatus.textContent = "❌ Insufficient Points";
    pointsStatus.className = "text-lg font-semibold text-red-400";

    if (usePointsBtn) {
      usePointsBtn.disabled = true;
      usePointsBtn.innerHTML =
        '<i class="fa-solid fa-ban mr-2"></i>Insufficient Points';
    }

    const pointsNeededMore = pointsNeeded - userPoints;
    if (pointsMessage) {
      pointsMessage.innerHTML = `
        <i class="insufficient fa-solid fa-exclamation-triangle mr-2 text-yellow-400"></i>
        You need <span class="font-semibold text-yellow-300">${pointsNeededMore.toLocaleString()}</span> more points to pay with points.
        <span class="insufficient block text-white/70 text-xs mt-1">
          Complete your purchase with credit card to earn more points!
        </span>
      `;
      pointsMessage.className =
        "mt-4 text-sm p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30";
    }
  }

  // Update points to earn display
  const pointsToEarnEl = document.getElementById("pointsToEarn");
  if (pointsToEarnEl) {
    const cart = getCart();
    const subtotal = calculateCartTotal();
    const pointsEarnedFromPurchase = Math.floor(subtotal / 10);
    pointsToEarnEl.textContent = pointsEarnedFromPurchase;
  }

  // Update main payment button state
  updatePaymentButtonState();
}

// ============ payment method toggle ============
function setupPaymentMethodToggle() {
  const paymentOptions = document.querySelectorAll(".payment-option");
  const paymentDetails = document.querySelectorAll(".payment-details");
  const selectedPaymentMethod = document.getElementById(
    "selectedPaymentMethod"
  );

  paymentOptions.forEach((option) => {
    option.addEventListener("click", function () {
      const method = this.dataset.option;

      // Update radio button
      const radio = this.querySelector(".payment-radio");
      radio.checked = true;

      // Update current payment method
      currentPaymentMethod = method;

      // Update UI to show selected method
      paymentOptions.forEach((opt) => {
        opt.classList.remove("bg-purple-900/50", "border-purple-500/50");
        opt.classList.add("bg-white/10", "border-white/15");
      });

      this.classList.remove("bg-white/10", "border-white/15");
      this.classList.add("bg-purple-900/50", "border-purple-500/50");

      // Show/hide details
      paymentDetails.forEach((detail) => {
        detail.classList.add("hidden");
      });

      if (method === "card") {
        document.getElementById("cardDetails").classList.remove("hidden");
        selectedPaymentMethod.textContent = "Credit Card";
        selectedPaymentMethod.className =
          "text-sm sm:text-base font-semibold text-purple-300";
      } else if (method === "points") {
        document.getElementById("pointsDetails").classList.remove("hidden");
        selectedPaymentMethod.textContent = "Prison Realm Points";
        selectedPaymentMethod.className =
          "text-sm sm:text-base font-semibold text-yellow-300";
      }

      // Update payment button state
      updatePaymentButtonState();
    });
  });

  // Initialize with card selected
  document.querySelector('.payment-option[data-option="card"]').click();
}

// ============ check delivery form validation ============
function checkDeliveryForm() {
  const delivery = getDeliveryData();
  const errors = validateDelivery(delivery);
  isDeliveryFormValid = !errors;
  return isDeliveryFormValid;
}

// ============ update payment button state ============
function updatePaymentButtonState() {
  const sealBtn = document.getElementById("sealOrderBtn");
  if (!sealBtn) return;

  // Check if cart is empty
  const cart = getCart();
  if (!cart.length) {
    sealBtn.disabled = true;
    sealBtn.classList.add("opacity-50", "cursor-not-allowed");
    sealBtn.classList.remove("hover:from-purple-700", "hover:to-indigo-700");
    sealBtn.innerHTML =
      '<i class="fa-solid fa-cart-shopping mr-2"></i>Cart is Empty';
    return;
  }

  // Check if delivery form is valid
  const isDeliveryValid = checkDeliveryForm();

  if (currentPaymentMethod === "card") {
    // For credit card: need valid card AND valid delivery form
    const canPay = isCardValid && isDeliveryValid;

    if (canPay) {
      sealBtn.disabled = false;
      sealBtn.classList.remove("opacity-50", "cursor-not-allowed");
      sealBtn.classList.add("hover:from-purple-700", "hover:to-indigo-700");
      sealBtn.innerHTML =
        '<i class="fa-solid fa-lock mr-2"></i>Pay with Credit Card';
      sealBtn.className = sealBtn.className.replace(
        /from-[^\s]+ to-[^\s]+/,
        "from-purple-600 to-indigo-600"
      );
    } else {
      sealBtn.disabled = true;
      sealBtn.classList.add("opacity-50", "cursor-not-allowed");
      sealBtn.classList.remove("hover:from-purple-700", "hover:to-indigo-700");

      if (!isDeliveryValid) {
        sealBtn.innerHTML =
          '<i class="fa-solid fa-triangle-exclamation mr-2"></i>Complete Delivery Details';
      } else if (!isCardValid) {
        sealBtn.innerHTML =
          '<i class="fa-solid fa-credit-card mr-2"></i>Complete Card Details';
      }
    }
  } else if (currentPaymentMethod === "points") {
    // For points: need sufficient points AND valid delivery form
    const pointsNeeded = Math.floor(orderTotalYen / 10);
    const hasEnoughPoints = userPoints >= pointsNeeded;
    const canPay = hasEnoughPoints && isDeliveryValid;

    if (canPay) {
      sealBtn.disabled = false;
      sealBtn.classList.remove("opacity-50", "cursor-not-allowed");
      sealBtn.classList.add("hover:from-yellow-700", "hover:to-orange-700");
      sealBtn.innerHTML = `<i class="fa-solid fa-bolt mr-2"></i>Pay with ${pointsNeeded.toLocaleString()} Points`;
      sealBtn.className = sealBtn.className.replace(
        /from-[^\s]+ to-[^\s]+/,
        "from-yellow-600 to-orange-600"
      );
    } else {
      sealBtn.disabled = true;
      sealBtn.classList.add("opacity-50", "cursor-not-allowed");
      sealBtn.classList.remove("hover:from-yellow-700", "hover:to-orange-700");

      if (!isDeliveryValid) {
        sealBtn.innerHTML =
          '<i class="fa-solid fa-triangle-exclamation mr-2"></i>Complete Delivery Details';
        sealBtn.className = sealBtn.className.replace(
          /from-[^\s]+ to-[^\s]+/,
          "from-purple-600 to-indigo-600"
        );
      } else if (!hasEnoughPoints) {
        sealBtn.innerHTML =
          '<i class="fa-solid fa-ban mr-2"></i>Insufficient Points';
        sealBtn.className = sealBtn.className.replace(
          /from-[^\s]+ to-[^\s]+/,
          "from-gray-600 to-gray-700"
        );
      }
    }
  }
}

// ============ setup form validation listeners ============
function setupFormValidation() {
  // Get all delivery form inputs
  const deliveryInputs = [
    "fullName",
    "phone",
    "postalCode",
    "address1",
    "city",
    "prefecture",
  ];

  // Add input event listeners to all delivery fields
  deliveryInputs.forEach((fieldId) => {
    const input = document.getElementById(fieldId);
    if (input) {
      input.addEventListener("input", () => {
        updatePaymentButtonState();
      });
      input.addEventListener("blur", () => {
        updatePaymentButtonState();
      });
    }
  });

  // Also listen for card name input
  const cardNameInput = document.getElementById("cardName");
  if (cardNameInput) {
    cardNameInput.addEventListener("input", () => {
      // Card name is required for card payments
      if (currentPaymentMethod === "card") {
        updatePaymentButtonState();
      }
    });
  }
}

// ============ payment processing ============
async function handlePayment() {
  const cardError = document.getElementById("card-errors");
  const sealBtn = document.getElementById("sealOrderBtn");

  try {
    // disable button and show loading
    sealBtn.disabled = true;
    const originalText = sealBtn.innerHTML;
    sealBtn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Processing...';
    cardError.textContent = "";

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

    console.log("Payment method:", currentPaymentMethod);

    if (currentPaymentMethod === "card") {
      // Validate card before proceeding
      if (!isCardValid) {
        throw new Error("Please complete your card details");
      }

      const cardName = document.getElementById("cardName")?.value.trim();
      if (!cardName) {
        throw new Error("Please enter the name on your card");
      }

      // Credit card payment
      await processCreditCardPayment(token, items, delivery);
    } else if (currentPaymentMethod === "points") {
      // Points payment
      await processPointsPayment(token, items, delivery);
    }
  } catch (error) {
    console.error("Payment failed:", error);
    cardError.textContent = error.message;
    sealBtn.disabled = false;
    sealBtn.innerHTML = originalText;
    updatePaymentButtonState();
  }
}

// ============ process credit card payment ============
async function processCreditCardPayment(token, items, delivery) {
  console.log("Processing credit card payment...");

  // create payment intent on backend
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

  // confirm card payment
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
      return_url: new URL("confirmed.html", window.location.href).toString(),
    }
  );

  if (error) {
    console.error("Stripe error:", error);
    throw new Error(error.message);
  }

  console.log("Payment intent result:", paymentIntent);

  if (paymentIntent.status === "succeeded") {
    console.log("Payment succeeded:", paymentIntent.id);

    // Calculate points earned
    const subtotal = calculateCartTotal();
    const pointsEarned = Math.floor(subtotal / 10);

    // create order in database
    await createOrder(
      paymentIntent.id,
      delivery,
      items,
      token,
      "stripe_card",
      0 // points used = 0 for card payment
    );

    // refresh points after purchase
    const freshPoints = await fetchUserPoints();
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    currentUser.points = freshPoints;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    // clear cart
    localStorage.setItem("cart", JSON.stringify([]));
    updateHeaderCartCount();

    // Save order to localStorage for display
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push({
      orderId: `stripe_${paymentIntent.id.slice(-8)}`,
      status: "PAID",
      totalYen: orderTotalYen,
      totalCents: orderTotalYen * 100,
      subtotalCents: (orderTotalYen - 3.18) * 100, // Subtract shipping
      shippingCents: 318,
      paymentMethod: "stripe_card",
      pointsUsed: 0,
      pointsEarned: pointsEarned,
      recipientName: delivery.fullName,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("orders", JSON.stringify(orders));

    // redirect to success page
    window.location.href = `confirmed.html?payment_intent=${paymentIntent.id}&points_earned=${pointsEarned}&success=true`;
  } else {
    throw new Error(`Payment status: ${paymentIntent.status}`);
  }
}

// ============ process points payment ============
async function processPointsPayment(token, items, delivery) {
  console.log("Processing points payment...");

  // Calculate points needed (10 yen = 1 point)
  const pointsNeeded = Math.floor(orderTotalYen / 10);

  console.log(`Points payment details:`);
  console.log(`- Order total: ¥${orderTotalYen}`);
  console.log(`- Points needed: ${pointsNeeded}`);
  console.log(`- User points: ${userPoints}`);

  if (userPoints < pointsNeeded) {
    throw new Error(
      `Insufficient points. Need ${pointsNeeded} but have ${userPoints}`
    );
  }

  try {
    // Create order with points payment
    const orderData = {
      items: items,
      shippingCents: 318,
      recipientName: delivery.fullName,
      email: getUserEmailFromStorage(),
      phone: delivery.phone,
      addressLine: buildAddressLine(delivery),
      postalCode: delivery.postalCode,
      paymentMethod: "points",
      pointsUsed: pointsNeeded,
    };

    console.log("Creating order with points payment:", orderData);

    const response = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();
    console.log("Points payment response:", data);

    if (!data.success) {
      throw new Error(data.message || "Points payment failed");
    }

    // Update user points in localStorage
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    currentUser.points = data.userPoints || userPoints - pointsNeeded;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    // Clear cart
    localStorage.setItem("cart", JSON.stringify([]));
    updateHeaderCartCount();

    // Save order to localStorage for display
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push({
      orderId: data.orderId,
      status: "PAID",
      totalYen: orderTotalYen,
      totalCents: orderTotalYen * 100,
      subtotalCents: (orderTotalYen - 3.18) * 100, // Subtract shipping
      shippingCents: 318,
      paymentMethod: "points",
      pointsUsed: pointsNeeded,
      pointsEarned: 0,
      recipientName: delivery.fullName,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("orders", JSON.stringify(orders));

    // Redirect to success page
    window.location.href = `confirmed.html?order_id=${data.orderId}&payment_method=points&points_used=${pointsNeeded}&success=true`;
  } catch (error) {
    console.error("Points payment failed:", error);
    throw error;
  }
}

// ============ create order in database (for card payments) ============
async function createOrder(
  paymentId,
  delivery,
  items,
  token,
  paymentMethod,
  pointsUsed
) {
  try {
    const userEmail = getUserEmailFromStorage();

    const orderData = {
      stripePaymentIntentId: paymentMethod === "stripe_card" ? paymentId : null,
      paymentMethod: paymentMethod,
      pointsUsed: pointsUsed,
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
        totalYen: orderTotalYen,
        totalCents: orderTotalYen * 100,
        subtotalCents: (orderTotalYen - 3.18) * 100,
        shippingCents: 318,
        paymentMethod: paymentMethod,
        pointsUsed: pointsUsed,
        pointsEarned: data.pointsEarned || 0,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("orders", JSON.stringify(orders));
    }
  } catch (error) {
    console.error("Failed to create order:", error);
    throw error;
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

function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login to checkout");
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// ============ render order totals ============
function renderTotals() {
  const cart = getCart();

  const emptyMsg = document.getElementById("emptyMsg");
  const detailsCard = document.querySelector(".container");
  const sealBtn = document.getElementById("sealOrderBtn");

  if (!cart.length) {
    if (detailsCard) detailsCard.classList.add("hidden");
    if (emptyMsg) emptyMsg.classList.remove("hidden");
    if (sealBtn) {
      sealBtn.disabled = true;
      sealBtn.classList.add("opacity-50", "cursor-not-allowed");
    }
    return;
  }

  if (detailsCard) detailsCard.classList.remove("hidden");
  if (emptyMsg) emptyMsg.classList.add("hidden");

  const itemsTotal = calculateCartTotal();
  const deliveryFee = 318;
  orderTotalYen = itemsTotal + deliveryFee;
  const pointsEarned = Math.floor(itemsTotal / 10);
  orderTotalPoints = Math.floor(orderTotalYen / 10);

  if (document.getElementById("itemsTotal")) {
    document.getElementById("itemsTotal").textContent = formatYen(itemsTotal);
  }
  if (document.getElementById("deliveryFee")) {
    document.getElementById("deliveryFee").textContent = formatYen(deliveryFee);
  }
  if (document.getElementById("totalYen")) {
    document.getElementById("totalYen").textContent = formatYen(orderTotalYen);
  }
  if (document.getElementById("pointsEarned")) {
    document.getElementById("pointsEarned").textContent = `+${pointsEarned}`;
  }
  if (document.getElementById("pointsToEarn")) {
    document.getElementById("pointsToEarn").textContent = pointsEarned;
  }
}

function formatYen(amount) {
  return `¥${Number(amount).toLocaleString()}`;
}

// ============ initialize ============
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Checkout page loaded");

  // update cart display
  renderTotals();
  updateHeaderCartCount();

  // check if user is logged in
  if (!checkAuth()) return;

  try {
    // fetch user points
    userPoints = await fetchUserPoints();
    console.log("User points:", userPoints);

    // update points display
    updatePointsDisplay();

    // setup payment method toggle
    setupPaymentMethodToggle();

    // setup form validation listeners
    setupFormValidation();

    // initialize Stripe
    await initializeStripe();

    // Setup points payment button
    const usePointsBtn = document.getElementById("usePointsBtn");
    if (usePointsBtn) {
      usePointsBtn.addEventListener("click", () => {
        // When user clicks "Pay with Points", switch to points payment method
        document.querySelector('.payment-option[data-option="points"]').click();
      });
    }

    // Initial button state update
    updatePaymentButtonState();
  } catch (error) {
    console.error("Initialization error:", error);
  }

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

  // Auto-refresh points every 10 seconds
  setInterval(async () => {
    try {
      const freshPoints = await fetchUserPoints();
      if (freshPoints !== userPoints) {
        userPoints = freshPoints;
        updatePointsDisplay();
        console.log("Points refreshed:", userPoints);
      }
    } catch (err) {
      console.error("Failed to refresh points:", err);
    }
  }, 10000);
});
