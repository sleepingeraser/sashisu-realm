// ============ configuration ============
const API_BASE = "http://localhost:3000/api";

// ============ stripe elements ============
let stripe;
let elements;
let cardElement;

// ============ initialize stripe ============
async function initializeStripe() {
  try {
    // Get publishable key from backend
    const response = await fetch(`${API_BASE}/payments/config`);
    const { publishableKey } = await response.json();

    stripe = Stripe(publishableKey);

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

    cardElement = elements.create("card", { style: style });
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
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
    alert("Payment system initialization failed. Please refresh the page.");
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

    // get cart data
    const cart = getCart();
    if (!cart.length) {
      throw new Error("Your cart is empty");
    }

    // format items for backend
    const items = cart.map((item) => ({
      productId: item.id,
      qty: item.qty || 1,
    }));

    // G\get delivery info
    const delivery = getDeliveryData();
    const deliveryErr = validateDelivery(delivery);
    if (deliveryErr) {
      throw new Error(deliveryErr);
    }

    // create payment intent on backend
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const response = await fetch(`${API_BASE}/payments/create-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: items,
        shippingCents: 318, // fixed shipping fee
      }),
    });

    const { clientSecret, paymentIntentId } = await response.json();

    if (!clientSecret) {
      throw new Error("No client secret received from server");
    }

    // confirm card payment
    const { paymentIntent, error } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: delivery.fullName,
            email: getUserEmailFromStorage(),
            phone: delivery.phone,
            address: {
              line1: delivery.address1,
              line2: delivery.address2 || "",
              city: delivery.city,
              state: delivery.prefecture,
              postal_code: delivery.postalCode,
              country: "JP",
            },
          },
        },
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    if (paymentIntent.status === "succeeded") {
      // create order in database
      await createOrder(paymentIntentId, delivery, items);

      // clear cart
      localStorage.setItem("cart", JSON.stringify([]));
      updateHeaderCartCount();

      // redirect to success page
      window.location.href = "confirmed.html";
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

// ============ create order in database ============
async function createOrder(paymentIntentId, delivery, items) {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        stripePaymentIntentId: paymentIntentId,
        recipientName: delivery.fullName,
        email: getUserEmailFromStorage(),
        phone: delivery.phone,
        addressLine: buildAddressLine(delivery),
        postalCode: delivery.postalCode,
        items: items,
      }),
    });

    const data = await response.json();
    console.log("Order created:", data);
  } catch (error) {
    console.error("Failed to create order:", error);
  }
}

// ============ Helper Functions ============
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
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
    const user = JSON.parse(
      localStorage.getItem("currentUser") ||
        localStorage.getItem("user") ||
        "{}"
    );
    return user.email || "";
  } catch {
    return "";
  }
}

// ============ initialize ============
document.addEventListener("DOMContentLoaded", async function () {
  // initialize Stripe
  await initializeStripe();

  // update cart count
  updateHeaderCartCount();

  // handle payment button click
  document
    .getElementById("sealOrderBtn")
    .addEventListener("click", handlePayment);

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
