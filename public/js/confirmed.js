document.getElementById("viewOrdersBtn").addEventListener("click", () => {
  window.location.href = "orders.html";
});

function formatYen(amount) {
  return `¥${Number(amount).toLocaleString()}`;
}

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

function getUserPoints() {
  return Number(localStorage.getItem("points") || "0");
}

function setUserPoints(points) {
  localStorage.setItem("points", String(Math.max(Number(points) || 0, 0)));
}

function setCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function showOrderOnPage(order) {
  const orderIdEl = document.getElementById("orderId");
  const orderTotalEl = document.getElementById("orderTotal");
  const orderPointsEl = document.getElementById("orderPoints");

  if (orderIdEl) orderIdEl.textContent = order.orderId || "—";
  if (orderTotalEl) orderTotalEl.textContent = formatYen(order.total || 0);
  if (orderPointsEl)
    orderPointsEl.textContent = `+${Number(order.pointsEarned || 0)}`;
}

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

async function verifyStripeSession(sessionId) {
  const res = await fetch(
    `/api/verify-session?session_id=${encodeURIComponent(sessionId)}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to verify payment");
  return data; // { payment_status: "paid" ... }
}

async function finalizeStripeOrderIfNeeded() {
  const sessionId = getQueryParam("session_id");
  if (!sessionId) return false;

  // verify payment with backend
  const session = await verifyStripeSession(sessionId);

  if (session.payment_status !== "paid") {
    alert("Payment not completed. Returning to checkout.");
    window.location.href = "checkout.html";
    return true;
  }

  // move pendingOrder -> orders
  const raw = localStorage.getItem("pendingOrder");
  if (!raw) {
    // maybe already finalized
    return false;
  }

  let pending;
  try {
    pending = JSON.parse(raw);
  } catch {
    return false;
  }

  const orders = getOrders();
  orders.push(pending);
  setOrders(orders);

  // earn points
  const wallet = getUserPoints();
  setUserPoints(wallet + Number(pending.pointsEarned || 0));

  // clear cart
  setCart([]);
  updateHeaderCartCount();

  // clean up pending order
  localStorage.removeItem("pendingOrder");

  // show it
  showOrderOnPage(pending);
  return true;
}

function showLatestOrderFallback() {
  const orders = getOrders();
  if (!orders.length) return;
  const last = orders[orders.length - 1];
  showOrderOnPage(last);
}

// ---------- side menu (safe) ----------
const sideMenu = document.getElementById("sideMenu");
const menuBtn = document.getElementById("menuBtn");
const closeMenuBtn = document.getElementById("closeMenuBtn");

function openMenu() {
  if (!sideMenu) return;
  sideMenu.classList.remove("translate-x-[-110%]");
  sideMenu.classList.add("translate-x-0");
}
function closeMenu() {
  if (!sideMenu) return;
  sideMenu.classList.add("translate-x-[-110%]");
  sideMenu.classList.remove("translate-x-0");
}

if (menuBtn) menuBtn.addEventListener("click", openMenu);
if (closeMenuBtn) closeMenuBtn.addEventListener("click", closeMenu);

document.addEventListener("click", (e) => {
  if (!sideMenu) return;
  if (!sideMenu.classList.contains("translate-x-0")) return;

  const clickedInside = sideMenu.contains(e.target);
  const clickedMenuBtn = menuBtn && menuBtn.contains(e.target);
  if (!clickedInside && !clickedMenuBtn) closeMenu();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});

// init
(async function init() {
  updateHeaderCartCount();

  try {
    const handled = await finalizeStripeOrderIfNeeded();
    if (!handled) showLatestOrderFallback();
  } catch (e) {
    console.error(e);
    alert("Could not verify Stripe payment. Returning to checkout.");
    window.location.href = "checkout.html";
  }
})();
