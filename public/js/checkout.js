// ============ helpers ============
function getToken() {
  return localStorage.getItem("token");
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
}

function formatYen(amount) {
  return `¥${Number(amount).toLocaleString()}`;
}

function calcPoints(totalYen) {
  return Math.floor(Number(totalYen) / 10);
}

function updateHeaderCartCount() {
  const cart = getCart();
  const totalQty = cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
  const el = document.getElementById("cartCount");
  if (el) el.textContent = totalQty;
}

function showError(msg) {
  const el = document.getElementById("errorMsg");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearError() {
  const el = document.getElementById("errorMsg");
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
}

function getPayMethod() {
  const checked = document.querySelector('input[name="payMethod"]:checked');
  return checked ? checked.value : "card";
}

function getUserEmailFromStorage() {
  try {
    const u1 = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (u1?.email) return String(u1.email);
  } catch {}
  try {
    const u2 = JSON.parse(localStorage.getItem("user") || "null");
    if (u2?.email) return String(u2.email);
  } catch {}
  return "";
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
  // Backend expects ONE string: addressLine
  const parts = [
    d.address1,
    d.address2,
    d.city,
    d.prefecture,
  ].filter(Boolean);
  return parts.join(", ");
}

// ============ API helpers ============
async function apiGet(path) {
  const res = await fetch(path, { method: "GET" });
  const raw = await res.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { rawText: raw };
  }
  if (!res.ok) throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
  return data;
}

async function apiPost(path, body, tokenRequired = false) {
  const headers = { "Content-Type": "application/json" };

  if (tokenRequired) {
    const token = getToken();
    if (!token) throw new Error("You are not logged in. Please login again.");
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body || {}),
  });

  const raw = await res.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { rawText: raw };
  }

  if (!res.ok) throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
  return data;
}

// ============ Stripe setup (split fields) ============
let stripe = null;
let elements = null;
let cardNumberEl = null;
let cardExpiryEl = null;
let cardCvcEl = null;

async function initStripeCardUI() {
  const cfg = await apiGet("/api/payments/config");
  const publishableKey = cfg.publishableKey;
  if (!publishableKey) throw new Error("Missing Stripe publishable key.");

  stripe = Stripe(publishableKey);
  elements = stripe.elements();

  const stripeStyle = {
    base: {
      color: "#ffffff",
      fontSize: "16px",
      fontFamily:
        "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      "::placeholder": { color: "rgba(255,255,255,0.55)" },
    },
    invalid: { color: "#fca5a5" },
  };

  cardNumberEl = elements.create("cardNumber", { style: stripeStyle });
  cardExpiryEl = elements.create("cardExpiry", { style: stripeStyle });
  cardCvcEl = elements.create("cardCvc", { style: stripeStyle });

  const num = document.getElementById("card-number");
  const exp = document.getElementById("card-expiry");
  const cvc = document.getElementById("card-cvc");
  if (!num || !exp || !cvc) {
    throw new Error("Missing #card-number / #card-expiry / #card-cvc in HTML.");
  }

  cardNumberEl.mount(num);
  cardExpiryEl.mount(exp);
  cardCvcEl.mount(cvc);

  const errEl = document.getElementById("card-error");
  const showStripeError = (event) => {
    if (!errEl) return;
    errEl.textContent = event.error ? event.error.message : "";
  };

  cardNumberEl.on("change", showStripeError);
  cardExpiryEl.on("change", showStripeError);
  cardCvcEl.on("change", showStripeError);
}

// ============ totals on page ============
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

  const itemsTotal = cart.reduce(
    (sum, it) => sum + Number(it.price || 0) * Number(it.qty || 1),
    0
  );

  const deliveryFee = 318;
  const totalYen = itemsTotal + deliveryFee;
  const points = calcPoints(itemsTotal);

  document.getElementById("itemsTotal").textContent = formatYen(itemsTotal);
  document.getElementById("deliveryFee").textContent = formatYen(deliveryFee);
  document.getElementById("totalYen").textContent = formatYen(totalYen);
  document.getElementById("pointsEarned").textContent = `+${points}`;
}

// show/hide card UI when user switches pay method
function syncPaymentUI() {
  const cardWrap = document.getElementById("cardWrap");
  const pointsHint = document.getElementById("pointsHint");

  const method = getPayMethod();
  if (cardWrap) cardWrap.classList.toggle("hidden", method !== "card");
  if (pointsHint) pointsHint.classList.toggle("hidden", method !== "points");
}

// ============ checkout submit ============
async function handleSealOrder() {
  clearError();

  const cart = getCart();
  if (!cart.length) {
    showError("Your cart is empty. There is nothing to seal.");
    return;
  }

  const delivery = getDeliveryData();
  const deliveryErr = validateDelivery(delivery);
  if (deliveryErr) {
    showError(deliveryErr);
    return;
  }

  const method = getPayMethod();

  const btn = document.getElementById("sealOrderBtn");
  btn.disabled = true;
  const oldText = btn.textContent;
  btn.textContent = "SEALING...";

  try {
    // ✅ BACKEND EXPECTS: productId + qty
    const items = cart.map((it) => ({
      productId: String(it.id),
      qty: Number(it.qty || 1),
    }));

    // Shipping in cents (you display ¥318; backend expects shippingCents number)
    const shippingCents = 318;

    if (method === "card") {
      // PaymentIntent (requires auth on backend)
      const pi = await apiPost(
        "/api/payments/create-payment-intent",
        { items, shippingCents },
        true
      );

      const clientSecret = pi.clientSecret;
      if (!clientSecret) throw new Error("Missing clientSecret from server.");

      // Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberEl,
          billing_details: {
            name: delivery.fullName,
          },
        },
      });

      if (result.error) throw new Error(result.error.message);
      if (!result.paymentIntent) throw new Error("No PaymentIntent returned.");
      if (result.paymentIntent.status !== "succeeded") {
        throw new Error(`Payment status: ${result.paymentIntent.status}`);
      }

      // ✅ BACKEND ORDER EXPECTS THESE DELIVERY FIELDS:
      // recipientName, email, phone, addressLine, postalCode (NOT a "delivery" object)
      const orderPayload = {
        items,
        shippingCents,
        recipientName: delivery.fullName,
        email: getUserEmailFromStorage(),
        phone: delivery.phone,
        addressLine: buildAddressLine(delivery),
        postalCode: delivery.postalCode,
        stripePaymentIntentId: result.paymentIntent.id,
      };

      if (!orderPayload.email) {
        throw new Error("Missing email. Please login again.");
      }

      await apiPost("/api/orders", orderPayload, true);

      // clear cart locally
      localStorage.setItem("cart", JSON.stringify([]));
      updateHeaderCartCount();

      // go orders page (your orders.html currently reads localStorage; later you’ll switch to API)
      window.location.href = "orders.html";
      return;
    }

    showError("Points payment not wired to backend yet. Use card for now.");
  } catch (err) {
    showError(err.message || "Something went wrong.");
  } finally {
    btn.textContent = oldText;
    btn.disabled = false;
  }
}

// ============ side menu ============
function initSideMenu() {
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
}

// ============ init ============
(async function init() {
  updateHeaderCartCount();
  renderTotals();
  initSideMenu();

  if (!getToken()) {
    window.location.href = "login.html";
    return;
  }

  try {
    await initStripeCardUI();
  } catch (e) {
    console.error(e);
    showError("Stripe card form failed to load. Check publishable key / console.");
  }

  document.querySelectorAll('input[name="payMethod"]').forEach((r) => {
    r.addEventListener("change", syncPaymentUI);
  });
  syncPaymentUI();

  document
    .getElementById("sealOrderBtn")
    .addEventListener("click", handleSealOrder);
})();
