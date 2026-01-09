const API_BASE = "";

const itemsTotalEl = document.getElementById("itemsTotal");
const deliveryFeeEl = document.getElementById("deliveryFee");
const totalYenEl = document.getElementById("totalYen");
const pointsEarnedEl = document.getElementById("pointsEarned");

const sealBtn = document.getElementById("sealOrderBtn");
const errorMsg = document.getElementById("errorMsg");
const emptyMsg = document.getElementById("emptyMsg");

const pointsHint = document.getElementById("pointsHint");
const userPointsEl = document.getElementById("userPoints");
const neededPointsEl = document.getElementById("neededPoints");

// ---------- constants ----------
const DELIVERY_FEE = 318;

const payRadios = Array.from(
  document.querySelectorAll('input[name="payMethod"]')
);

// delivery inputs
const fullNameEl = document.getElementById("fullName");
const phoneEl = document.getElementById("phone");
const postalCodeEl = document.getElementById("postalCode");
const address1El = document.getElementById("address1");
const address2El = document.getElementById("address2");
const cityEl = document.getElementById("city");
const prefectureEl = document.getElementById("prefecture");

// stripe UI
const cardWrap = document.getElementById("cardWrap");
const cardErrorEl = document.getElementById("card-error");

// ---------- helpers ----------
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
}
function setCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function getOrders() {
  try {
    return JSON.parse(localStorage.getItem("orders")) || [];
  } catch {
    return [];
  }
}
function setOrders(orders) {
  localStorage.setItem("orders", JSON.stringify(orders));
}

function formatYen(amount) {
  return `¥${Number(amount).toLocaleString()}`;
}
function calcPointsFromYen(totalYen) {
  return Math.floor(Number(totalYen) / 10);
}

function getUserPoints() {
  return Number(localStorage.getItem("points") || "0");
}
function setUserPoints(points) {
  localStorage.setItem("points", String(Math.max(Number(points) || 0, 0)));
}

function updateHeaderCartCount() {
  const cart = getCart();
  const totalQty = cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
  const el = document.getElementById("cartCount");
  if (el) el.textContent = totalQty;
}

function computeItemsTotal(cart) {
  let total = 0;
  cart.forEach((item) => {
    total += Number(item.price || 0) * Number(item.qty || 1);
  });
  return total;
}

function makeOrderId() {
  return "local_" + String(Math.floor(100000 + Math.random() * 900000));
}

function getSelectedPayMethod() {
  const picked = payRadios.find((r) => r.checked);
  return picked ? picked.value : "card";
}

function showError(msg) {
  if (!errorMsg) return;
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}
function clearError() {
  if (!errorMsg) return;
  errorMsg.textContent = "";
  errorMsg.classList.add("hidden");
}

function getDeliveryDetails() {
  return {
    fullName: (fullNameEl?.value || "").trim(),
    phone: (phoneEl?.value || "").trim(),
    postalCode: (postalCodeEl?.value || "").trim(),
    address1: (address1El?.value || "").trim(),
    address2: (address2El?.value || "").trim(),
    city: (cityEl?.value || "").trim(),
    prefecture: (prefectureEl?.value || "").trim(),
  };
}

function deliveryDetailsValid() {
  const d = getDeliveryDetails();
  return (
    d.fullName &&
    d.phone &&
    d.postalCode &&
    d.address1 &&
    d.city &&
    d.prefecture
  );
}

function buildAddressLine(d) {
  const a2 = d.address2 ? `, ${d.address2}` : "";
  return `${d.address1}${a2}, ${d.city}, ${d.prefecture}`;
}

function toggleCardUI() {
  const method = getSelectedPayMethod();
  if (cardWrap) cardWrap.classList.toggle("hidden", method !== "card");
}

// ---------- backend fetch ----------
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ---------- points UI ----------
function updatePointsUI(method, grandTotal) {
  if (!pointsHint || !userPointsEl || !neededPointsEl) return;

  if (method === "points") {
    const wallet = getUserPoints();
    const need = calcPointsFromYen(grandTotal);
    userPointsEl.textContent = wallet.toLocaleString();
    neededPointsEl.textContent = need.toLocaleString();
    pointsHint.classList.remove("hidden");
  } else {
    pointsHint.classList.add("hidden");
  }
}

// ---------- state ----------
let cart = getCart();
let itemsTotal = computeItemsTotal(cart);
let grandTotal = 0;
let earnedPoints = 0;

// ---------- render ----------
function renderSummary() {
  cart = getCart();
  itemsTotal = computeItemsTotal(cart);

  grandTotal = itemsTotal + DELIVERY_FEE;
  earnedPoints = calcPointsFromYen(grandTotal);

  if (itemsTotalEl) itemsTotalEl.textContent = formatYen(itemsTotal);
  if (deliveryFeeEl) deliveryFeeEl.textContent = formatYen(DELIVERY_FEE);
  if (totalYenEl) totalYenEl.textContent = formatYen(grandTotal);
  if (pointsEarnedEl) pointsEarnedEl.textContent = `+${earnedPoints}`;

  if (!cart.length) {
    if (emptyMsg) emptyMsg.classList.remove("hidden");
    if (sealBtn) {
      sealBtn.disabled = true;
      sealBtn.classList.add("opacity-50", "cursor-not-allowed");
    }
  } else {
    if (emptyMsg) emptyMsg.classList.add("hidden");
    if (sealBtn) {
      sealBtn.disabled = false;
      sealBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }

  updatePointsUI(getSelectedPayMethod(), grandTotal);
  toggleCardUI();
}

// ---------- stripe setup ----------
let stripe = null;
let cardNumber = null;
let cardExpiry = null;
let cardCvc = null;

async function initStripe() {
  const cfg = await apiFetch("/api/payments/config");
  if (!cfg?.publishableKey) throw new Error("Missing Stripe publishable key");

  stripe = Stripe(cfg.publishableKey);

  const elements = stripe.elements();

  const style = {
    base: {
      color: "#fff",
      fontSize: "16px",
      "::placeholder": { color: "#9CA3AF" },
    },
    invalid: { color: "#FCA5A5" },
  };

  // create 3 separate fields
  cardNumber = elements.create("cardNumber", { style });
  cardExpiry = elements.create("cardExpiry", { style });
  cardCvc = elements.create("cardCvc", { style });

  // mount to your new IDs
  cardNumber.mount("#card-number");
  cardExpiry.mount("#card-expiry");
  cardCvc.mount("#card-cvc");

  const showStripeError = (e) => {
    const el = document.getElementById("card-error");
    if (el) el.textContent = e.error ? e.error.message : "";
  };

  cardNumber.on("change", showStripeError);
  cardExpiry.on("change", showStripeError);
  cardCvc.on("change", showStripeError);
}

// ---------- events ----------
payRadios.forEach((r) => {
  r.addEventListener("change", () => {
    clearError();
    renderSummary();
  });
});

[
  fullNameEl,
  phoneEl,
  postalCodeEl,
  address1El,
  address2El,
  cityEl,
  prefectureEl,
].forEach((el) => {
  if (!el) return;
  el.addEventListener("input", () => {
    if (!errorMsg?.classList.contains("hidden")) clearError();
  });
});

// ---------- seal order ----------
if (sealBtn) {
  sealBtn.addEventListener("click", async () => {
    clearError();

    cart = getCart();
    if (!cart.length) {
      showError("Nothing to seal. Your cart is empty.");
      return;
    }

    if (!deliveryDetailsValid()) {
      showError("Complete your delivery details. No missing fields.");
      return;
    }

    // totals
    itemsTotal = computeItemsTotal(cart);
    grandTotal = itemsTotal + DELIVERY_FEE;
    earnedPoints = calcPointsFromYen(grandTotal);

    const method = getSelectedPayMethod();
    const d = getDeliveryDetails();

    // build order payload for backend
    const orderPayload = {
      items: cart.map((c) => ({
        productId: String(c.id),
        qty: Number(c.qty || 1),
      })),
      shippingCents: DELIVERY_FEE,
      recipientName: d.fullName,
      email: null,
      phone: d.phone,
      addressLine: buildAddressLine(d),
      postalCode: d.postalCode,
      stripePaymentIntentId: null,
    };

    // ---- POINTS (local demo) ----
    if (method === "points") {
      const wallet = getUserPoints();
      const need = calcPointsFromYen(grandTotal);

      if (wallet < need) {
        showError("Insufficient points. Choose card or earn more points.");
        return;
      }

      // deduct + earn (local)
      setUserPoints(wallet - need);
      const walletNow = getUserPoints();
      setUserPoints(walletNow + earnedPoints);

      // store local order
      const pendingOrder = {
        orderId: makeOrderId(),
        itemsTotal,
        deliveryFee: DELIVERY_FEE,
        total: grandTotal,
        status: "PAID",
        deliveryMethod: "Delivery",
        deliveryDetails: d,
        paymentMethod: "Prison Realm Points",
        pointsEarned: earnedPoints,
        createdAt: new Date().toISOString(),
        items: cart.map((c) => ({
          id: c.id,
          name: c.name,
          price: c.price,
          qty: c.qty,
          image: c.image,
        })),
      };

      const orders = getOrders();
      orders.push(pendingOrder);
      setOrders(orders);

      setCart([]);
      updateHeaderCartCount();

      window.location.href = "confirmed.html";
      return;
    }

    // ---- CARD (stripe paymentIntent + backend order) ----
    try {
      // must be logged in to create PI because endpoint is protected
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Login required before card payment.");
        window.location.href = "login.html";
        return;
      }

      if (!stripe || !cardNumber || !cardExpiry || !cardCvc) {
        showError("Stripe is not ready yet. Refresh and try again.");
        return;
      }

      // get email from backend session
      const me = await apiFetch("/api/me");
      orderPayload.email = me.email;

      // 1) create PaymentIntent (server calculates totals from DB)
      const pi = await apiFetch("/api/payments/create-payment-intent", {
        method: "POST",
        body: JSON.stringify({
          items: orderPayload.items,
          shippingCents: DELIVERY_FEE,
        }),
      });

      // 2) confirm payment in browser
      const cardNameEl = document.getElementById("cardName");
      const cardholderName = (cardNameEl?.value || "").trim();

      const result = await stripe.confirmCardPayment(pi.clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: { name: cardholderName },
        },
      });

      // 3) store order in DB
      orderPayload.stripePaymentIntentId = result.paymentIntent.id;

      const created = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });

      // clear cart + go confirmed (you can show orderId later)
      setCart([]);
      updateHeaderCartCount();

      // store for confirmed page if you want
      localStorage.setItem("lastOrderId", created.orderId);

      window.location.href = "confirmed.html";
    } catch (e) {
      console.error(e);
      showError(e?.message || "Card checkout failed.");
    }
  });
}

// ---------- side menu ----------
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

// ---------- init ----------
updateHeaderCartCount();
renderSummary();
initStripe().catch((e) => showError(e.message || "Stripe init failed"));
