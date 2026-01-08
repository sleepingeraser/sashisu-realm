const allProducts = [
  // posters / UNO / sets
  {
    id: "1",
    name: "Attack on Titan UNO",
    price: 1300,
    category: "card",
    image: "/images/attackOnTitanUNO.jpg",
    tags: ["aot", "uno"],
  },
  {
    id: "2",
    name: "Boku no Academia A3 Poster",
    price: 880,
    category: "poster",
    image: "/images/bokuNoAcademiaA3Poster.jpg",
    tags: ["mha", "poster"],
  },
  {
    id: "3",
    name: "Jujutsu Kaisen Hidden Inventory Mini Shikishi Collection",
    price: 2750,
    category: "card",
    image: "/images/jujutsuKaisenHiddenInventoryMiniSjikishiCollection.jpg",
    tags: ["jjk", "hidden-inventory"],
  },
  {
    id: "4",
    name: "Boku no Academia Villains Glass Style Trading Foiled Mini Shikishi",
    price: 1600,
    category: "card",
    image:
      "/images/bokuNoAcademiaVillainsGlassStyleTradingFoiledMiniShikishi.jpg",
    tags: ["mha", "villains"],
  },
  {
    id: "5",
    name: "Jujutsu Kaisen UNO",
    price: 1300,
    category: "card",
    image: "/images/jujutsuKaisenUNO.jpg",
    tags: ["jjk", "uno"],
  },

  // Plush
  {
    id: "6",
    name: "Chuya NuiPal Plush",
    price: 1980,
    category: "plush",
    image: "/images/chuyaNuiPalPlush.jpg",
    tags: ["bsd", "chuya"],
  },
  {
    id: "7",
    name: "Dazai NuiPal Plush",
    price: 1980,
    category: "plush",
    image: "/images/dazaiNuiPalPlush.jpg",
    tags: ["bsd", "dazai"],
  },

  // Acrylic stands / figures
  {
    id: "8",
    name: "Dabi Stained Glass Acrylic Stand",
    price: 2090,
    category: "stand",
    image: "/images/dabiStainedGlassStyleAcrylicStand.jpg",
    tags: ["mha", "dabi"],
  },
  {
    id: "9",
    name: "Hawks Acrylic Stand",
    price: 1690,
    category: "stand",
    image: "/images/hawksAcrylicStand.jpg",
    tags: ["mha", "hawks"],
  },
  {
    id: "10",
    name: "Kentou Umbrella Acrylic Stand",
    price: 1560,
    category: "stand",
    image: "/images/kentouUmbrellaAcrylicStand.jpg",
    tags: ["jjk", "nanami", "kentou"],
  },
  {
    id: "11",
    name: "Satoru Amusement Park Acrylic Stand",
    price: 1980,
    category: "stand",
    image: "/images/satoruAmusementParkAcrylicStand.jpg",
    tags: ["jjk", "gojo"],
  },
  {
    id: "12",
    name: "Shota Aizawa Acrylic Stand",
    price: 1780,
    category: "stand",
    image: "/images/shotaAcrylicStand9.jpg",
    tags: ["mha", "aizawa"],
  },
  {
    id: "13",
    name: "Sukuna Pale Tone Acrylic Stand",
    price: 1480,
    category: "stand",
    image: "/images/sunkunaPaleToneAcrylicStand.jpg",
    tags: ["jjk", "sukuna"],
  },
  {
    id: "14",
    name: "Satoru Okinawa Figure",
    price: 3550,
    category: "figure",
    image: "/images/satoruOkinawaFigure.jpg",
    tags: ["jjk", "gojo", "figure"],
  },

  // Keychains
  {
    id: "15",
    name: "Cinnamoroll Acrylic Keychain",
    price: 860,
    category: "keychain",
    image: "/images/cinnamorollAcrylicKeychain.jpg",
    tags: ["sanrio", "keychain"],
  },
  {
    id: "16",
    name: "Eren Chimikemo Mascot",
    price: 1980,
    category: "mascot",
    image: "/images/erenChimikemoMascot.jpg",
    tags: ["aot", "eren"],
  },
  {
    id: "17",
    name: "Levi Chimikemo Mascot",
    price: 1980,
    category: "mascot",
    image: "/images/leviChimikemoMascot.jpg",
    tags: ["aot", "levi"],
  },
  {
    id: "18",
    name: "Mikasa Chinikemo Masot",
    price: 1980,
    category: "mascot",
    image: "/images/mikasaChinikemoMasot.jpg",
    tags: ["aot", "mikasa"],
  },
  {
    id: "19",
    name: "Miku Dango Masot Keychain",
    price: 1560,
    category: "keychain",
    image: "/images/mikuDangoMasotKeychain.jpg",
    tags: ["vocaloid", "miku"],
  },
  {
    id: "20",
    name: "PomPomPurin Acrylic Keychain",
    price: 860,
    category: "keychain",
    image: "/images/pomPomPurinAcrylicKeychain.jpg",
    tags: ["sanrio", "keychain"],
  },
  {
    id: "21",
    name: "Katsuki Slide Acrylic Keychain",
    price: 1100,
    category: "keychain",
    image: "/images/katsukiSlideAcrylicKeychain.jpg",
    tags: ["mha", "bakugo"],
  },
  {
    id: "22",
    name: "Shoto Slide Acrylic Keychain",
    price: 1100,
    category: "keychain",
    image: "/images/shotoSlideAcrylicKeychain.jpg",
    tags: ["mha", "todoroki"],
  },

  // Stickers
  {
    id: "23",
    name: "Katsuki Sticker",
    price: 385,
    category: "sticker",
    image: "/images/katsukiSticker.jpg",
    tags: ["mha", "bakugo"],
  },
  {
    id: "24",
    name: "Shoto Sticker",
    price: 385,
    category: "sticker",
    image: "/images/shotoSticker.jpg",
    tags: ["mha", "todoroki"],
  },
  {
    id: "25",
    name: "Shota Sticker",
    price: 385,
    category: "sticker",
    image: "/images/shotaSticker.jpg",
    tags: ["mha", "aizawa"],
  },

  // Postcards / Trading foiled / collections
  {
    id: "26",
    name: "Suguru Hidden Inventory Postcard Set",
    price: 550,
    category: "postcard",
    image: "/images/SuguruHiddenInnventoryPostcardSet.jpg",
    tags: ["jjk", "geto"],
  },
  {
    id: "27",
    name: "Satoru Hidden Inventory Postcard Set",
    price: 1650,
    category: "postcard",
    image: "/images/satoruHiddenInventoryPostcardSet.jpg",
    tags: ["jjk", "gojo"],
  },
  {
    id: "28",
    name: "Satoru S2 Chara Badge Collection",
    price: 2640,
    category: "badge",
    image: "/images/satoruS2CharaBadgeCollection.jpg",
    tags: ["jjk", "gojo"],
  },
  {
    id: "29",
    name: "Kento S2 Chara Badge Collection",
    price: 2640,
    category: "badge",
    image: "/images/kentoS2CharaBadgeCollection.jpg",
    tags: ["jjk", "nanami"],
  },
  {
    id: "30",
    name: "Choso S2 Chara Badge Collection",
    price: 2640,
    category: "badge",
    image: "/images/chosoS2CharaBadgeCollection.jpg",
    tags: ["jjk", "choso"],
  },
];

const offset = Number(req.query.offset || 0);
const limit = Number(req.query.limit || 9);

const slice = allProducts.slice(offset, offset + limit);

res.status(200).json({
  products: slice,
  hasMore: offset + limit < allProducts.length,
});
