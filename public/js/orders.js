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

// ---------- fetch orders from backend ----------
async function fetchOrdersFromBackend() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.log("No token found, redirecting to login");
    window.location.href = "login.html";
    return [];
  }

  try {
    const response = await fetch("http://localhost:3000/api/orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      // token expired
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
      window.location.href = "login.html";
      return [];
    }

    const data = await response.json();

    if (data.success && data.orders) {
      // save orders to localStorage for offline viewing
      localStorage.setItem("orders", JSON.stringify(data.orders));
      return data.orders;
    } else {
      console.error("Failed to fetch orders:", data.message);
      return [];
    }
  } catch (err) {
    console.error("Error fetching orders:", err);
    // fallback to localStorage if fetch fails
    return getOrdersFromLocalStorage();
  }
}

function getOrdersFromLocalStorage() {
  try {
    return JSON.parse(localStorage.getItem("orders")) || [];
  } catch {
    return [];
  }
}

// ---------- render ----------
const ordersList = document.getElementById("ordersList");
const emptyOrders = document.getElementById("emptyOrders");

async function renderOrders() {
  console.log("Rendering orders...");

  // try to fetch fresh orders from backend
  let orders = await fetchOrdersFromBackend();

  // if no orders from backend, try localStorage
  if (!orders || orders.length === 0) {
    orders = getOrdersFromLocalStorage();
  }

  // sort newest first
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!orders.length) {
    ordersList.innerHTML = "";
    emptyOrders.classList.remove("hidden");
    return;
  }

  emptyOrders.classList.add("hidden");
  ordersList.innerHTML = "";

  console.log(`Displaying ${orders.length} orders`);

  orders.forEach((order) => {
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
    const formattedDate = orderDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // payment method badge
    let paymentBadge = "";
    if (order.paymentMethod === "points") {
      paymentBadge = `<span class="px-2 py-1 text-xs rounded-full bg-yellow-900/50 text-yellow-300 border border-yellow-700/50">
                        <i class="fa-solid fa-coins mr-1"></i>Points Payment
                      </span>`;
    } else {
      paymentBadge = `<span class="px-2 py-1 text-xs rounded-full bg-purple-900/50 text-purple-300 border border-purple-700/50">
                        <i class="fa-solid fa-credit-card mr-1"></i>Card Payment
                      </span>`;
    }

    // status badge
    let statusBadge = "";
    if (order.status === "PAID") {
      statusBadge = `<span class="px-2 py-1 text-xs rounded-full bg-green-900/50 text-green-300 border border-green-700/50">
                       <i class="fa-solid fa-check mr-1"></i>Paid
                     </span>`;
    } else {
      statusBadge = `<span class="px-2 py-1 text-xs rounded-full bg-yellow-900/50 text-yellow-300 border border-yellow-700/50">
                       <i class="fa-solid fa-clock mr-1"></i>Processing
                     </span>`;
    }

    // Points info
    let pointsInfo = "";
    if (order.pointsUsed > 0) {
      pointsInfo += `
        <div class="flex items-center text-sm text-yellow-300 mt-1">
          <i class="fa-solid fa-coins mr-2"></i>
          <span>Used ${order.pointsUsed} points</span>
        </div>`;
    }
    if (order.pointsEarned > 0) {
      pointsInfo += `
        <div class="flex items-center text-sm text-green-300 mt-1">
          <i class="fa-solid fa-star mr-2"></i>
          <span>Earned ${order.pointsEarned} points</span>
        </div>`;
    }

    const card = document.createElement("div");
    card.className =
      "box block rounded-2xl bg-black/35 border border-purple-500/20 backdrop-blur-md hover:bg-black/45 transition-all duration-300 shadow-lg shadow-purple-700/10 p-4 mb-4";

    card.innerHTML = `
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div class="text-sm text-white/70">Order #${
            order.orderId || order.Id || "N/A"
          }</div>
          <div class="text-xs text-white/50">${formattedDate}</div>
        </div>
        
        <div class="flex items-center gap-2">
          ${paymentBadge}
          ${statusBadge}
        </div>
        
        <div class="text-2xl font-bold text-white mt-2">
          ${formatYen(order.totalYen || order.totalCents / 100 || 0)}
        </div>
        
        <div class="text-sm text-white/80">
          ${order.recipientName || "Customer"}
        </div>
        
        ${pointsInfo}
        
        <div class="flex items-center justify-between text-xs text-white/60 mt-3 pt-3 border-t border-white/10">
          <div>
            <i class="fa-solid fa-box mr-1"></i>
            Items: ¥${(
              order.subtotalYen ||
              order.subtotalCents / 100 ||
              0
            ).toLocaleString()}
          </div>
          <div>
            <i class="fa-solid fa-truck mr-1"></i>
            Shipping: ¥${(
              order.shippingYen ||
              order.shippingCents / 100 ||
              318
            ).toLocaleString()}
          </div>
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

// refresh orders every 30 seconds if user stays on page
setInterval(() => {
  console.log("Refreshing orders...");
  renderOrders();
}, 30000);
