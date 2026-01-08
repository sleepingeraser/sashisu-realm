let allProducts = [];
let offset = 0;
const pageSize = 9;

const grid = document.getElementById("productsGrid");
const moreBtn = document.getElementById("moreBtn");

const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const sortSelect = document.getElementById("sortSelect");

// ---------- cart ----------
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

function updateCartCount() {
  const cart = getCart();
  let totalQty = 0;
  cart.forEach((item) => (totalQty += Number(item.qty || 1)));
  document.getElementById("cartCount").textContent = totalQty;
}

function addToCart(product) {
  const cart = getCart();
  const found = cart.find((c) => c.id === product.id);

  if (found) found.qty = Number(found.qty || 1) + 1;
  else
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1,
    });

  setCart(cart);
  updateCartCount();
  alert(`Added: ${product.name}`);
}

// ---------- JPY ----------
function formatYen(amount) {
  return `¥${Number(amount).toLocaleString()}`;
}

// ---------- filter/sort/search ----------
function applySearchFilterSort(products) {
  const q = searchInput.value.trim().toLowerCase();
  const filter = filterSelect.value;
  const sort = sortSelect.value;

  let result = [...products];

  if (q) {
    result = result.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.tags || []).join(" ").toLowerCase().includes(q)
    );
  }

  if (filter !== "all") {
    result = result.filter((p) => (p.category || "").toLowerCase() === filter);
  }

  if (sort === "price-asc") result.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") result.sort((a, b) => b.price - a.price);
  if (sort === "name-asc") result.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "newest")
    result.sort((a, b) => String(b.id).localeCompare(String(a.id)));

  return result;
}

// ---------- render ----------
function render() {
  const filtered = applySearchFilterSort(allProducts);

  grid.innerHTML = "";

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center text-white/80 py-10">No items found.</div>`;
    return;
  }

  filtered.forEach((p) => {
    const card = document.createElement("div");

    // Card container (added hover polish)
    card.className =
      "rounded-2xl bg-black/40 border border-purple-500/20 overflow-hidden shadow-lg shadow-purple-700/10 " +
      "transition transform hover:-translate-y-1 hover:shadow-purple-700/30";

    card.innerHTML = `
      <div class="aspect-square bg-black/30 flex items-center justify-center">
        <img src="${p.image}" alt="${
      p.name
    }" class="w-full h-full object-cover" />
      </div>

      <!-- Centered content + aligned spacing -->
      <div class="p-4 flex flex-col items-center text-center gap-2">
        <div class="product-title text-sm font-semibold text-white/95 leading-snug min-h-[42px] flex items-center justify-center">
          ${p.name}
        </div>

        <div class="text-sm text-white/70">
          ${formatYen(p.price)}
        </div>

        <button
          type="button"
          class="mt-2 button-text px-8 py-2 rounded-xl
                 bg-purple-700/70 hover:bg-purple-700
                 border border-purple-500/20 transition"
        >
          Take it
        </button>
      </div>
    `;

    card.querySelector("button").addEventListener("click", () => addToCart(p));
    grid.appendChild(card);
  });
}

// ---------- serverless pagination ----------
async function loadNextPage() {
  const res = await fetch(`/api/products?offset=${offset}&limit=${pageSize}`);
  const data = await res.json();

  const newItems = data.products || [];
  allProducts = allProducts.concat(newItems);
  offset += newItems.length;

  if (!data.hasMore) moreBtn.classList.add("hidden");

  render();
}

// ---------- MORE button loading ----------
moreBtn.addEventListener("click", async () => {
  moreBtn.disabled = true;
  const oldText = moreBtn.textContent;
  moreBtn.textContent = "LOADING...";

  try {
    await loadNextPage();
  } finally {
    moreBtn.textContent = oldText;
    moreBtn.disabled = false;
  }
});

// controls
searchInput.addEventListener("input", render);
filterSelect.addEventListener("change", render);
sortSelect.addEventListener("change", render);

// side menu
const sideMenu = document.getElementById("sideMenu");
document.getElementById("menuBtn").addEventListener("click", () => {
  sideMenu.classList.remove("translate-x-[-110%]");
  sideMenu.classList.add("translate-x-0");
});
document.getElementById("closeMenuBtn").addEventListener("click", () => {
  sideMenu.classList.add("translate-x-[-110%]");
  sideMenu.classList.remove("translate-x-0");
});

// init
updateCartCount();
loadNextPage(); // loads 9 automatically
