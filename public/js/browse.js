// ---------- LOCAL PRODUCT DATA ----------
const PRODUCTS = [
  {
    id: "1",
    name: "Attack on Titan UNO",
    price: 1300,
    category: "card",
    image: "images/attackOnTitanUNO.jpg",
    tags: ["aot", "uno"],
  },
  {
    id: "2",
    name: "Boku no Academia A3 Poster",
    price: 880,
    category: "poster",
    image: "images/bokuNoAcademiaA3Poster.jpg",
    tags: ["mha", "poster"],
  },
  {
    id: "3",
    name: "Jujutsu Kaisen Hidden Inventory Mini Shikishi Collection",
    price: 2750,
    category: "card",
    image: "images/jujutsuKaisenHiddenInventoryMiniSjikishiCollection.jpg",
    tags: ["jjk", "hidden-inventory"],
  },
  {
    id: "4",
    name: "Boku no Academia Villains Glass Style Trading Foiled Mini Shikishi",
    price: 1600,
    category: "card",
    image:
      "images/bokuNoAcademiaVillainsGlassStyleTradingFoiledMiniShikishi.jpg",
    tags: ["mha", "villains"],
  },
  {
    id: "5",
    name: "Jujutsu Kaisen UNO",
    price: 1300,
    category: "card",
    image: "images/jujutsuKaisenUNO.jpg",
    tags: ["jjk", "uno"],
  },

  // Plush
  {
    id: "6",
    name: "Chuya NuiPal Plush",
    price: 1980,
    category: "plush",
    image: "images/chuyaNuiPalPlush.jpg",
    tags: ["bsd", "chuya"],
  },
  {
    id: "7",
    name: "Dazai NuiPal Plush",
    price: 1980,
    category: "plush",
    image: "images/dazaiNuiPalPlush.jpg",
    tags: ["bsd", "dazai"],
  },

  // Acrylic stands / figures
  {
    id: "8",
    name: "Dabi Stained Glass Acrylic Stand",
    price: 2090,
    category: "stand",
    image: "images/dabiStainedGlassStyleAcrylicStand.jpg",
    tags: ["mha", "dabi"],
  },
  {
    id: "9",
    name: "Hawks Acrylic Stand",
    price: 1690,
    category: "stand",
    image: "images/hawksAcrylicStand.jpg",
    tags: ["mha", "hawks"],
  },
  {
    id: "10",
    name: "Kento Umbrella Acrylic Stand",
    price: 1560,
    category: "stand",
    image: "images/kentoUmbrellaAcrylicStand.jpg",
    tags: ["jjk", "nanami", "kentou"],
  },
  {
    id: "11",
    name: "Satoru Amusement Park Acrylic Stand",
    price: 1980,
    category: "stand",
    image: "images/satoruAmusementParkAcrylicStand.jpg",
    tags: ["jjk", "gojo"],
  },
  {
    id: "12",
    name: "Shota Aizawa Acrylic Stand",
    price: 1780,
    category: "stand",
    image: "images/shotaAcrylicStand9.jpg",
    tags: ["mha", "aizawa"],
  },
  {
    id: "13",
    name: "Sukuna Pale Tone Acrylic Stand",
    price: 1480,
    category: "stand",
    image: "images/sunkunaPaleToneAcrylicStand.jpg",
    tags: ["jjk", "sukuna"],
  },
  {
    id: "14",
    name: "Satoru Okinawa Figure",
    price: 3550,
    category: "figure",
    image: "images/satoruOkinawaFigure.jpg",
    tags: ["jjk", "gojo", "figure"],
  },

  // Keychains
  {
    id: "15",
    name: "Cinnamoroll Acrylic Keychain",
    price: 860,
    category: "keychain",
    image: "images/cinnamorollAcrylicKeychain.jpg",
    tags: ["sanrio", "keychain"],
  },
  {
    id: "16",
    name: "Eren Chimikemo Mascot",
    price: 1980,
    category: "mascot",
    image: "images/erenChimikemoMascot.jpg",
    tags: ["aot", "eren"],
  },
  {
    id: "17",
    name: "Levi Chimikemo Mascot",
    price: 1980,
    category: "mascot",
    image: "images/leviChimikemoMascot.jpg",
    tags: ["aot", "levi"],
  },
  {
    id: "18",
    name: "Mikasa Chinikemo Masot",
    price: 1980,
    category: "mascot",
    image: "images/mikasaChinikemoMasot.jpg",
    tags: ["aot", "mikasa"],
  },
  {
    id: "19",
    name: "Miku Dango Masot Keychain",
    price: 1560,
    category: "keychain",
    image: "images/mikuDangoMasotKeychain.jpg",
    tags: ["vocaloid", "miku"],
  },
  {
    id: "20",
    name: "PomPomPurin Acrylic Keychain",
    price: 860,
    category: "keychain",
    image: "images/pomPomPurinAcrylicKeychain.jpg",
    tags: ["sanrio", "keychain"],
  },
  {
    id: "21",
    name: "Katsuki Slide Acrylic Keychain",
    price: 1100,
    category: "keychain",
    image: "images/katsukiSlideAcrylicKeychain.jpg",
    tags: ["mha", "bakugo"],
  },
  {
    id: "22",
    name: "Shoto Slide Acrylic Keychain",
    price: 1100,
    category: "keychain",
    image: "images/shotoSlideAcrylicKeychain.jpg",
    tags: ["mha", "todoroki"],
  },

  // Stickers
  {
    id: "23",
    name: "Katsuki Sticker",
    price: 385,
    category: "sticker",
    image: "images/katsukiSticker.jpg",
    tags: ["mha", "bakugo"],
  },
  {
    id: "24",
    name: "Shoto Sticker",
    price: 385,
    category: "sticker",
    image: "images/shotoSticker.jpg",
    tags: ["mha", "todoroki"],
  },
  {
    id: "25",
    name: "Shota Sticker",
    price: 385,
    category: "sticker",
    image: "images/shotaSticker.jpg",
    tags: ["mha", "aizawa"],
  },

  // Postcards / Trading foiled / collections
  {
    id: "26",
    name: "Suguru Hidden Inventory Postcard Set",
    price: 550,
    category: "postcard",
    image: "images/SuguruHiddenInventoryPostcardSet.jpg",
    tags: ["jjk", "geto"],
  },
  {
    id: "27",
    name: "Satoru Hidden Inventory Postcard Set",
    price: 1650,
    category: "postcard",
    image: "images/satoruHiddenInventoryPostcardSet.jpg",
    tags: ["jjk", "gojo"],
  },
  {
    id: "28",
    name: "Satoru S2 Chara Badge Collection",
    price: 2640,
    category: "badge",
    image: "images/satoruS2CharaBadgeCollection.jpg",
    tags: ["jjk", "gojo"],
  },
  {
    id: "29",
    name: "Kento S2 Chara Badge Collection",
    price: 2640,
    category: "badge",
    image: "images/kentoS2CharaBadgeCollection.jpg",
    tags: ["jjk", "nanami"],
  },
  {
    id: "30",
    name: "Choso S2 Chara Badge Collection",
    price: 2640,
    category: "badge",
    image: "images/chosoS2CharaBadgeCollection.jpg",
    tags: ["jjk", "choso"],
  },
];

// ---------- pagination state ----------
let allProducts = [];
let offset = 0;
const pageSize = 9;

// ---------- elements ----------
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
  const el = document.getElementById("cartCount");
  if (el) el.textContent = totalQty;
}

function addToCart(product) {
  const cart = getCart();
  const found = cart.find((c) => c.id === product.id);

  if (found) found.qty = Number(found.qty || 1) + 1;
  else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1,
    });
  }

  setCart(cart);
  updateCartCount();
  alert(`Added: ${product.name}`);
}

// ---------- money ----------
function formatYen(amount) {
  return `¥${Number(amount).toLocaleString()}`;
}

// ---------- filter/sort/search ----------
function applySearchFilterSort(products) {
  const q = (searchInput?.value || "").trim().toLowerCase();
  const filter = filterSelect?.value || "all";
  const sort = sortSelect?.value || "newest";

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
  if (sort === "newest") {
    // your ids are strings, but numeric strings => safe compare using Number
    result.sort((a, b) => Number(b.id) - Number(a.id));
  }

  return result;
}

// ---------- render ----------
function render() {
  if (!grid) return;

  const filtered = applySearchFilterSort(allProducts);

  grid.innerHTML = "";

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center text-white/80 py-10">No items found.</div>`;
    return;
  }

  filtered.forEach((p) => {
    const card = document.createElement("div");

    card.className =
      "rounded-2xl bg-black/40 border border-purple-500/20 overflow-hidden shadow-lg shadow-purple-700/10 " +
      "transition transform hover:-translate-y-1 hover:shadow-purple-700/30";

    card.innerHTML = `
      <div class="aspect-square bg-black/30 flex items-center justify-center">
        <img src="${p.image}" alt="${
      p.name
    }" class="w-full h-full object-cover" />
      </div>

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

// ---------- local "Load More" ----------
function loadNextPage() {
  const slice = PRODUCTS.slice(offset, offset + pageSize);
  allProducts = allProducts.concat(slice);
  offset += slice.length;

  if (moreBtn) {
    if (offset >= PRODUCTS.length) moreBtn.classList.add("hidden");
    else moreBtn.classList.remove("hidden");
  }

  render();
}

// ---------- MORE button ----------
if (moreBtn) {
  moreBtn.addEventListener("click", () => {
    moreBtn.disabled = true;
    const oldText = moreBtn.textContent;
    moreBtn.textContent = "LOADING...";

    try {
      loadNextPage();
    } finally {
      moreBtn.textContent = oldText;
      moreBtn.disabled = false;
    }
  });
}

// controls (safe)
if (searchInput) searchInput.addEventListener("input", render);
if (filterSelect) filterSelect.addEventListener("change", render);
if (sortSelect) sortSelect.addEventListener("change", render);

// side menu (safe)
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
updateCartCount();
loadNextPage(); // loads first 9
