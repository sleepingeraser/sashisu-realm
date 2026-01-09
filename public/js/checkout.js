// js/checkout.js

// ---------- elements ----------
const itemsTotalEl = document.getElementById("itemsTotal");
const deliveryFeeEl = document.getElementById("deliveryFee");
const totalYenEl = document.getElementById("totalYen");
const pointsEarnedEl = document.getElementById("pointsEarned");

const sealBtn = document.getElementById("sealOrderBtn");
const errorMsg = document.getElementById("errorMsg");
const emptyMsg = document.getElementById("emptyMsg");

// points hint elements
const pointsHint = document.getElementById("pointsHint");
const userPointsEl = document.getElementById("userPoints");
const neededPointsEl = document.getElementById("neededPoints");

// payment elements
const payRadios = Array.from(
  document.querySelectorAll('input[name="payMethod"]')
);

// delivery inputs (delivery-only)
const fullNameEl = document.getElementById("fullName");
const phoneEl = document.getElementById("phone");
const postalCodeEl = document.getElementById("postalCode");
const address1El = document.getElementById("address1");
const address2El = document.getElementById("address2");
const cityEl = document.getElementById("city");
const prefectureEl = document.getElementById("prefecture");

// ---------- constants ----------
const DELIVERY_FEE = 318;

const API_BASE = "https://sashisu-realm.vercel.app";

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

// every 10 yen = 1 point
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
  return String(Math.floor(100000 + Math.random() * 900000));
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
let deliveryFee = DELIVERY_FEE;
let grandTotal = 0;
let earnedPoints = 0;

// ---------- render summary ----------
function renderSummary() {
  cart = getCart();
  itemsTotal = computeItemsTotal(cart);

  deliveryFee = DELIVERY_FEE;
  grandTotal = itemsTotal + deliveryFee;

  earnedPoints = calcPointsFromYen(grandTotal);

  if (itemsTotalEl) itemsTotalEl.textContent = formatYen(itemsTotal);
  if (deliveryFeeEl) deliveryFeeEl.textContent = formatYen(deliveryFee);
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

// ---------- stripe helper ----------
async function createStripeSession(payload) {
  const res = await fetch(`${API_BASE}/api/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text(); // read as text first

  try {
    const data = JSON.parse(text);
    if (!res.ok)
      throw new Error(data?.error || "Failed to create Stripe session");
    return data;
  } catch {
    // shows the HTML/404 page so you can see what you hit
    throw new Error("Expected JSON but got:\n" + text.slice(0, 200));
  }
}

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

    // recalc totals (safe)
    itemsTotal = computeItemsTotal(cart);
    deliveryFee = DELIVERY_FEE;
    grandTotal = itemsTotal + deliveryFee;
    earnedPoints = calcPointsFromYen(grandTotal);

    const method = getSelectedPayMethod();

    // build order object (don’t save yet for Stripe card)
    const pendingOrder = {
      orderId: makeOrderId(),
      itemsTotal,
      deliveryFee,
      total: grandTotal,
      status: "Pre-Owned",
      deliveryMethod: "Delivery",
      deliveryDetails: getDeliveryDetails(),
      paymentMethod:
        method === "points" ? "Prison Realm Points" : "Credit/Debit Card",
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

    // POINTS METHOD (same as your current logic, but go to confirmed page)
    if (method === "points") {
      const wallet = getUserPoints();
      const need = calcPointsFromYen(grandTotal);

      if (wallet < need) {
        showError("Insufficient points. Choose card or earn more points.");
        return;
      }

      // deduct points
      setUserPoints(wallet - need);

      // save order
      const orders = getOrders();
      orders.push(pendingOrder);
      setOrders(orders);

      // earn points after purchase
      const walletNow = getUserPoints();
      setUserPoints(walletNow + earnedPoints);

      // clear cart
      setCart([]);
      updateHeaderCartCount();

      alert("Order sealed successfully. Points payment confirmed.");
      window.location.href = "confirmed.html";
      return;
    }

    // CARD METHOD (Stripe)
    try {
      // save pending order locally (finalize only after Stripe success)
      localStorage.setItem("pendingOrder", JSON.stringify(pendingOrder));

      // create stripe session
      const session = await createStripeSession({
        orderId: pendingOrder.orderId,
        cart: pendingOrder.items,
        deliveryFee: pendingOrder.deliveryFee,
        currency: "jpy",
      });

      // redirect to Stripe-hosted checkout
      window.location.href = session.url;
    } catch (e) {
      console.error(e);
      showError(e?.message || "Stripe checkout failed. Try again.");
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
