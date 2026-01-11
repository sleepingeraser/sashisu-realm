// ---------- API configuration ----------
const API_BASE = window.location.origin.includes("localhost")
  ? "http://localhost:3000/api"
  : "/api";

console.log("API Base URL:", API_BASE);

// ---------- helpers ----------
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
}

function uupdateCartCount() {
  const cart = getCart();
  const totalQty = cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
  const el = document.getElementById("cartCount");
  if (el) el.textContent = totalQty;
}

function getUser() {
  try {
    const fromCurrent = localStorage.getItem("currentUser");
    if (fromCurrent) return JSON.parse(fromCurrent);

    const fromUser = localStorage.getItem("user");
    if (fromUser) return JSON.parse(fromUser);

    return null;
  } catch {
    return null;
  }
}

async function fetchUserPoints() {
  const token = localStorage.getItem("token");
  if (!token) return 0;

  try {
    console.log("Fetching user points from:", `${API_BASE}/auth/me`);
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch user points:", response.status);
      return 0;
    }

    const data = await response.json();
    console.log("✅ User points data:", data.user?.points || 0);
    return data.user?.points || 0;
  } catch (err) {
    console.error("Failed to fetch user points:", err);
    return 0;
  }
}

async function displayUserInfo() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.log("No token found, redirecting to login");
    window.location.href = "login.html";
    return;
  }

  const user = getUser();

  const nameEl = document.getElementById("displayName");
  const emailEl = document.getElementById("emailText");
  const pointsEl = document.getElementById("pointsText");

  // avatar
  const avatarEl = document.getElementById("avatarImg");
  if (avatarEl) {
    const seed = user && user.email ? user.email : "guest";
    avatarEl.src = `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(
      seed
    )}`;
  }

  // name priority: codename > username > email prefix > fallback
  const name =
    (user && (user.codename || user.username)) ||
    (user && user.email ? user.email.split("@")[0] : "") ||
    "GUEST";

  if (nameEl) nameEl.textContent = name;
  if (emailEl) emailEl.textContent = (user && user.email) || "unknown@realm.jp";

  // fetch fresh points from server
  try {
    const points = await fetchUserPoints();
    if (pointsEl) {
      pointsEl.textContent = Number(points).toLocaleString();
      // update localStorage
      if (user) {
        user.points = points;
        localStorage.setItem("currentUser", JSON.stringify(user));
      }
    }
  } catch (err) {
    console.error("❌ Failed to fetch points, using cached:", err);
    const cachedPoints = user?.points || 0;
    if (pointsEl) pointsEl.textContent = Number(cachedPoints).toLocaleString();
  }
}

// ---------- sidebar ----------
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

// ---------- logout + leave ----------
const logoutBtn = document.getElementById("logoutBtn");
const leaveBtn = document.getElementById("leaveBtn");

function logoutAndExit() {
  console.log("👋 Logging out...");
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("user");
  localStorage.removeItem("cart");
  localStorage.removeItem("orders");
  window.location.href = "login.html";
}

if (logoutBtn) logoutBtn.addEventListener("click", logoutAndExit);

if (leaveBtn) {
  leaveBtn.addEventListener("click", () => {
    console.log("🚪 Leaving account page...");
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  });
}

// ---------- init ----------
document.addEventListener("DOMContentLoaded", function () {
  console.log("👤 Account page loaded");
  updateCartCount();
  displayUserInfo();
});
