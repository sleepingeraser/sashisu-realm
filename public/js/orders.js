// ---------- helpers ----------
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

// ---------- render ----------
const ordersList = document.getElementById("ordersList");
const emptyOrders = document.getElementById("emptyOrders");

function renderOrders() {
  const orders = getOrders();

  // newest first (by date if you stored it, else by id string)
  orders.sort((a, b) => {
    const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (bd !== ad) return bd - ad;
    return String(b.orderId || "").localeCompare(String(a.orderId || ""));
  });

  if (!orders.length) {
    ordersList.innerHTML = "";
    emptyOrders.classList.remove("hidden");
    return;
  }

  emptyOrders.classList.add("hidden");
  ordersList.innerHTML = "";

  orders.forEach((o) => {
    const orderId = o.orderId || "??????";
    const total = Number(o.total || 0);
    const status = o.status || "Pre-Owned"; // your vibe
    const statusClass = status.toLowerCase().includes("pre")
      ? "text-white/90"
      : "text-green-300";

    const card = document.createElement("a");
    card.href = `order-details.html?orderId=${encodeURIComponent(orderId)}`;
    card.className =
      "block rounded-2xl bg-black/35 border border-purple-500/20 backdrop-blur-md " +
      "hover:bg-black/45 transition shadow-lg shadow-purple-700/10 p-4";

    card.innerHTML = `
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="text-sm text-white/70">Order number <span class="text-green-300 font-semibold">${orderId}</span></div>
          <div class="text-lg font-semibold ${statusClass} mt-1">${status}</div>
        </div>

        <div class="text-lg sm:text-xl font-bold text-white/95">
          ${formatYen(total)}
        </div>
      </div>
    `;

    ordersList.appendChild(card);
  });
}

// ---------- buttons ----------
document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "account.html";
});

// ---------- side menu ----------
const sideMenu = document.getElementById("sideMenu");
document.getElementById("menuBtn").addEventListener("click", () => {
  sideMenu.classList.remove("translate-x-[-110%]");
  sideMenu.classList.add("translate-x-0");
});
document.getElementById("closeMenuBtn").addEventListener("click", () => {
  sideMenu.classList.add("translate-x-[-110%]");
  sideMenu.classList.remove("translate-x-0");
});

// ---------- init ----------
updateHeaderCartCount();
renderOrders();
