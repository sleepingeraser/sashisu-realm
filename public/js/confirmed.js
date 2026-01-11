document.addEventListener("DOMContentLoaded", function () {
  const viewOrdersBtn = document.getElementById("viewOrdersBtn");
  const orderIdEl = document.getElementById("orderId");
  const orderTotalEl = document.getElementById("orderTotal");
  const orderPointsEl = document.getElementById("orderPoints");

  // get the latest order from localStorage or URL params
  function displayOrderConfirmation() {
    // try to get order from URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentId = urlParams.get("payment_intent");
    const paymenstIntentClientSecret = urlParams.get(
      "payment_intent_client_secret"
    );

    // get order details from localStorage
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    const lastOrder = orders[orders.length - 1];

    if (lastOrder) {
      orderIdEl.textContent = lastOrder.orderId || "—";
      orderTotalEl.textContent = formatYen(lastOrder.total || 0);
      orderPointsEl.textContent = `+${lastOrder.pointsEarned || 0}`;
    } else if (paymentIntentId) {
      // show payment intent ID if no order in localStorage
      orderIdEl.textContent = `Payment: ${paymentIntentId.slice(0, 8)}...`;
      orderTotalEl.textContent = "¥0";
      orderPointsEl.textContent = "+0";
    }

    // update cart count
    updateCartCount();
  }

  function formatYen(amount) {
    return `¥${Number(amount).toLocaleString()}`;
  }

  function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const totalQty = cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
    const el = document.getElementById("cartCount");
    if (el) el.textContent = totalQty;
  }

  // side menu functionality
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

  // view orders button
  if (viewOrdersBtn) {
    viewOrdersBtn.addEventListener("click", () => {
      window.location.href = "orders.html";
    });
  }

  // initialize
  displayOrderConfirmation();
});
