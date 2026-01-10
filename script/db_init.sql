-- CREATE DATABASE SashisuRealmDB

USE SashisuRealmDB
GO

-- Drop existing tables if they exist
DROP TABLE IF EXISTS Sessions
DROP TABLE IF EXISTS OrderItems
DROP TABLE IF EXISTS Orders
DROP TABLE IF EXISTS Products
DROP TABLE IF EXISTS Users

-- users table
CREATE TABLE Users (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Username NVARCHAR(50) NOT NULL,
  Email NVARCHAR(255) NOT NULL UNIQUE,
  PasswordHash NVARCHAR(255) NOT NULL,
  Salt NVARCHAR(255) NOT NULL,
  Points INT NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
)

-- sessions table
CREATE TABLE Sessions (
  Token NVARCHAR(128) PRIMARY KEY,
  UserId INT NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  ExpiresAt DATETIME2 NOT NULL,
  CONSTRAINT FK_Sessions_Users FOREIGN KEY (UserId) REFERENCES Users(Id)
)

-- products table
CREATE TABLE Products (
  Id NVARCHAR(50) PRIMARY KEY,
  Name NVARCHAR(200) NOT NULL,
  ImageUrl NVARCHAR(500) NULL,
  PriceCents INT NOT NULL,
  Category NVARCHAR(100) NULL,
  Tags NVARCHAR(400) NULL
)

-- orders table with points tracking
CREATE TABLE Orders (
  Id NVARCHAR(80) PRIMARY KEY,
  UserId INT NOT NULL,
  StripePaymentIntentId NVARCHAR(100) NULL,
  Status NVARCHAR(30) NOT NULL, -- CREATED / PAID / FAILED
  SubtotalCents INT NOT NULL,
  ShippingCents INT NOT NULL,
  TotalCents INT NOT NULL,
  PaymentMethod NVARCHAR(30) NOT NULL DEFAULT 'stripe_card', -- 'stripe_card' or 'points'
  PointsEarned INT NOT NULL DEFAULT 0,
  PointsUsed INT NOT NULL DEFAULT 0,
  RecipientName NVARCHAR(120) NOT NULL,
  Email NVARCHAR(255) NOT NULL,
  Phone NVARCHAR(50) NOT NULL,
  AddressLine NVARCHAR(255) NOT NULL,
  PostalCode NVARCHAR(30) NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Orders_Users FOREIGN KEY (UserId) REFERENCES Users(Id)
)

-- orderItems table
CREATE TABLE OrderItems (
  OrderId NVARCHAR(80) NOT NULL,
  ProductId NVARCHAR(50) NOT NULL,
  Qty INT NOT NULL,
  UnitPriceCents INT NOT NULL,
  PRIMARY KEY (OrderId, ProductId),
  CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductId) REFERENCES Products(Id)
)

-- insert sample products
INSERT INTO Products (Id, Name, ImageUrl, PriceCents, Category, Tags) VALUES
(1, 'Attack on Titan UNO', '/images/attackOnTitanUNO.jpg', 1300, 'card', '["aot","uno"]'),
(2, 'Boku no Academia A3 Poster', '/images/bokuNoAcademiaA3Poster.jpg', 880, 'poster', '["mha","poster"]'),
(3, 'Jujutsu Kaisen Hidden Inventory Mini Shikishi Collection', '/images/jujutsuKaisenHiddenInventoryMiniSjikishiCollection.jpg', 2750, 'card', '["jjk","hidden-inventory"]'),
(4, 'Boku no Academia Villains Glass Style Trading Foiled Mini Shikishi', '/images/bokuNoAcademiaVillainsGlassStyleTradingFoiledMiniShikishi.jpg', 1600, 'card', '["mha","villains"]'),
(5, 'Jujutsu Kaisen UNO', '/images/jujutsuKaisenUNO.jpg', 1300, 'card', '["jjk","uno"]'),
(6, 'Chuya NuiPal Plush', '/images/chuyaNuiPalPlush.jpg', 1980, 'plush', '["bsd","chuya"]'),
(7, 'Dazai NuiPal Plush', '/images/dazaiNuiPalPlush.jpg', 1980, 'plush', '["bsd","dazai"]'),
(8, 'Dabi Stained Glass Acrylic Stand', '/images/dabiStainedGlassStyleAcrylicStand.jpg', 2090, 'stand', '["mha","dabi"]'),
(9, 'Hawks Acrylic Stand', '/images/hawksAcrylicStand.jpg', 1690, 'stand', '["mha","hawks"]'),
(10, 'Kentou Umbrella Acrylic Stand', '/images/kentouUmbrellaAcrylicStand.jpg', 1560, 'stand', '["jjk","nanami","kentou"]'),
(11, 'Satoru Amusement Park Acrylic Stand', '/images/satoruAmusementParkAcrylicStand.jpg', 1980, 'stand', '["jjk","gojo"]'),
(12, 'Shota Aizawa Acrylic Stand', '/images/shotaAcrylicStand9.jpg', 1780, 'stand', '["mha","aizawa"]'),
(13, 'Sukuna Pale Tone Acrylic Stand', '/images/sunkunaPaleToneAcrylicStand.jpg', 1480, 'stand', '["jjk","sukuna"]'),
(14, 'Satoru Okinawa Figure', '/images/satoruOkinawaFigure.jpg', 3550, 'figure', '["jjk","gojo","figure"]'),
(15, 'Cinnamoroll Acrylic Keychain', '/images/cinnamorollAcrylicKeychain.jpg', 860, 'keychain', '["sanrio","keychain"]'),
(16, 'Eren Chimikemo Mascot', '/images/erenChimikemoMascot.jpg', 1980, 'mascot', '["aot","eren"]'),
(17, 'Levi Chimikemo Mascot', '/images/leviChimikemoMascot.jpg', 1980, 'mascot', '["aot","levi"]'),
(18, 'Mikasa Chinikemo Masot', '/images/mikasaChinikemoMasot.jpg', 1980, 'mascot', '["aot","mikasa"]'),
(19, 'Miku Dango Masot Keychain', '/images/mikuDangoMasotKeychain.jpg', 1560, 'keychain', '["vocaloid","miku"]'),
(20, 'PomPomPurin Acrylic Keychain', '/images/pomPomPurinAcrylicKeychain.jpg', 860, 'keychain', '["sanrio","keychain"]'),
(21, 'Katsuki Slide Acrylic Keychain', '/images/katsukiSlideAcrylicKeychain.jpg', 1100, 'keychain', '["mha","bakugo"]'),
(22, 'Shoto Slide Acrylic Keychain', '/images/shotoSlideAcrylicKeychain.jpg', 1100, 'keychain', '["mha","todoroki"]'),
(23, 'Katsuki Sticker', '/images/katsukiSticker.jpg', 385, 'sticker', '["mha","bakugo"]'),
(24, 'Shoto Sticker', '/images/shotoSticker.jpg', 385, 'sticker', '["mha","todoroki"]'),
(25, 'Shota Sticker', '/images/shotaSticker.jpg', 385, 'sticker', '["mha","aizawa"]'),
(26, 'Suguru Hidden Inventory Postcard Set', '/images/SuguruHiddenInventoryPostcardSet.jpg', 550, 'postcard', '["jjk","geto"]'),
(27, 'Satoru Hidden Inventory Postcard Set', '/images/satoruHiddenInventoryPostcardSet.jpg', 1650, 'postcard', '["jjk","gojo"]'),
(28, 'Satoru S2 Chara Badge Collection', '/images/satoruS2CharaBadgeCollection.jpg', 2640, 'badge', '["jjk","gojo"]'),
(29, 'Kento S2 Chara Badge Collection', '/images/kentoS2CharaBadgeCollection.jpg', 2640, 'badge', '["jjk","nanami"]'),
(30, 'Choso S2 Chara Badge Collection', '/images/chosoS2CharaBadgeCollection.jpg', 2640, 'badge', '["jjk","choso"]');

SELECT * FROM Products ORDER BY Id
SELECT * FROM Sessions