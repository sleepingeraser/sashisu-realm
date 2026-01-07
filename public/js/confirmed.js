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

function showLatestOrder() {
  const orders = getOrders();
  if (!orders.length) return;

  const last = orders[orders.length - 1];

  const orderIdEl = document.getElementById("orderId");
  const orderTotalEl = document.getElementById("orderTotal");
  const orderPointsEl = document.getElementById("orderPoints");

  if (orderIdEl) orderIdEl.textContent = last.orderId || "—";
  if (orderTotalEl) orderTotalEl.textContent = formatYen(last.total || 0);
  if (orderPointsEl)
    orderPointsEl.textContent = `+${Number(last.pointsEarned || 0)}`;
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
updateHeaderCartCount();
showLatestOrder();
