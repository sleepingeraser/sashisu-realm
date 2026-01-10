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
    const response = await fetch("http://localhost:3000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data.user?.points || 0;
  } catch (err) {
    console.error("Failed to fetch user points:", err);
    return 0;
  }
}

async function displayUserInfo() {
  const token = localStorage.getItem("token");
  if (!token) {
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
    console.error("Failed to fetch points, using cached:", err);
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
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  });
}

// ---------- init ----------
updateCartCount();
displayUserInfo();
