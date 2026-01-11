// ---------- API configuration ----------
const API_BASE = window.location.origin.includes('localhost') 
  ? 'http://localhost:3000/api' 
  : '/api';

console.log("API Base URL:", API_BASE);

const cartList = document.getElementById("cartList");
const cartTotalEl = document.getElementById("cartTotal");
const pointsEl = document.getElementById("pointsEarned");
const emptyMsg = document.getElementById("emptyMsg");
const proceedBtn = document.getElementById("proceedBtn");

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

function formatYen(amount) {
  return `¥${Number(amount).toLocaleString()}`;
}

// points: every 10 yen = 1 point
function calcPoints(totalYen) {
  return Math.floor(Number(totalYen) / 10);
}

function updateHeaderCartCount() {
  const cart = getCart();
  const totalQty = cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
  const el = document.getElementById("cartCount");
  if (el) el.textContent = totalQty;
}

function computeTotals(cart) {
  let total = 0;
  cart.forEach((item) => {
    total += Number(item.price || 0) * Number(item.qty || 1);
  });
  return total;
}

// ---------- render ----------
function renderCart() {
  const cart = getCart();
  updateHeaderCartCount();

  // empty
  if (!cart.length) {
    cartList.innerHTML = "";
    if (cartTotalEl) cartTotalEl.textContent = formatYen(0);
    if (pointsEl) pointsEl.textContent = "+0";
    if (emptyMsg) emptyMsg.classList.remove("hidden");

    if (proceedBtn) {
      proceedBtn.disabled = true;
      proceedBtn.classList.add("opacity-50", "cursor-not-allowed");
    }
    return;
  }

  if (emptyMsg) emptyMsg.classList.add("hidden");
  
  if (proceedBtn) {
    proceedBtn.disabled = false;
    proceedBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }

  cartList.innerHTML = "";

  cart.forEach((item) => {
    const price = Number(item.price || 0);
    const qty = Number(item.qty || 1);

    const row = document.createElement("div");
    row.className =
      "flex items-center gap-3 rounded-2xl bg-black/35 border border-purple-500/15 p-3";

    row.innerHTML = `
      <div class="listItem w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-black/30 flex-shrink-0">
        <img src="${item.image}" alt="${
      item.name
    }" class="w-full h-full object-cover" />
      </div>

      <div class="itemTitle flex-1 min-w-0">
        <div class="text-sm sm:text-base font-semibold text-white/95 truncate">${
          item.name
        }</div>
        <div class="text-xs text-white/70 mt-1">${formatYen(price)}</div>

        <div class="quantity flex items-center gap-2">
          <button class="qtyMinus px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10" type="button">-</button>

          <div class="px-3 py-1 rounded-lg bg-black/40 border border-purple-500/20 text-sm">
            <span class="qtyVal">${qty}</span>
          </div>

          <button class="qtyPlus px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10" type="button">+</button>

          <div class="ml-auto text-xs sm:text-sm text-white/80">
            Subtotal: <span class="font-semibold">${formatYen(
              price * qty
            )}</span>
          </div>
        </div>
      </div>

      <button class="dropBtn px-3 py-2 rounded-xl bg-purple-700/40 hover:bg-purple-700/60 border border-purple-500/25 text-xs"
        type="button" title="Remove item">drop it</button>
    `;

    row.querySelector(".qtyMinus").addEventListener("click", () => {
      changeQty(item.id, -1);
    });

    row.querySelector(".qtyPlus").addEventListener("click", () => {
      changeQty(item.id, +1);
    });

    row.querySelector(".dropBtn").addEventListener("click", () => {
      removeItem(item.id);
    });

    cartList.appendChild(row);
  });

  // totals + points
  const total = computeTotals(cart);
  if (cartTotalEl) cartTotalEl.textContent = formatYen(total);
  if (pointsEl) pointsEl.textContent = `+${calcPoints(total)}`;
}

// ---------- cart actions ----------
function changeQty(productId, delta) {
  const cart = getCart();
  const item = cart.find((c) => c.id === productId);
  if (!item) return;

  const current = Number(item.qty || 1);
  const next = current + delta;

  // if goes to 0 => remove
  if (next <= 0) {
    setCart(cart.filter((c) => c.id !== productId));
    renderCart();
    return;
  }

  item.qty = next;
  setCart(cart);
  renderCart();
}

function removeItem(productId) {
  const cart = getCart();
  setCart(cart.filter((c) => c.id !== productId));
  renderCart();
}

// ---------- proceed to payment ----------
if (proceedBtn) {
  proceedBtn.addEventListener("click", () => {
    const cart = getCart();
    if (!cart.length) {
      alert("Cart is empty. No loot, no checkout.");
      return;
    }

    const total = computeTotals(cart);
    const points = calcPoints(total);

    localStorage.setItem("checkoutTotal", String(total));
    localStorage.setItem("checkoutPoints", String(points));

    window.location.href = "checkout.html";
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
document.addEventListener("DOMContentLoaded", function () {
  console.log("Cart page loaded");
  renderCart();
});