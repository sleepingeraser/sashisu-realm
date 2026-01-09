// ---------- helpers ----------
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
}

function updateCartCount() {
  const cart = getCart();
  const totalQty = cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
  const el = document.getElementById("cartCount");
  if (el) el.textContent = totalQty;
}

function getUser() {
  try {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function getUserPoints(user) {
  // Support multiple storage styles so your project won’t break:
  // 1) user.points
  // 2) localStorage.points
  // 3) localStorage.userPoints
  if (user && typeof user.points === "number") return user.points;

  const p1 = Number(localStorage.getItem("points"));
  if (!Number.isNaN(p1) && p1 >= 0) return p1;

  const p2 = Number(localStorage.getItem("userPoints"));
  if (!Number.isNaN(p2) && p2 >= 0) return p2;

  return 0;
}

function displayUserInfo() {
  const user = getUser();

  // ff not logged in / no token, send them to login
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const nameEl = document.getElementById("displayName");
  const emailEl = document.getElementById("emailText");
  const pointsEl = document.getElementById("pointsText");

  // name: codename > username > email prefix > fallback
  const name =
    (user && (user.codename || user.username)) ||
    (user && user.email ? user.email.split("@")[0] : "") ||
    "Guest";

  if (nameEl) nameEl.textContent = name;
  if (emailEl) emailEl.textContent = (user && user.email) || "unknown@realm.jp";

  const points = getUserPoints(user);
  if (pointsEl) pointsEl.textContent = Number(points).toLocaleString();
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
  // keep user + points if you want; remove token to "logout"
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

if (logoutBtn) logoutBtn.addEventListener("click", logoutAndExit);

if (leaveBtn) {
  leaveBtn.addEventListener("click", () => {
    // "Leave" = logout + go home (you can change destination)
    localStorage.removeItem("token");
    window.location.href = "index.html";
  });
}

// ---------- init ----------
updateCartCount();
displayUserInfo();
