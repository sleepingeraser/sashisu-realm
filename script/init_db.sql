-- CREATE DATABASE SashisuRealmDB;

USE SashisuRealmDB;
GO

-- drop existing tables if they exist
DROP TABLE IF EXISTS Products

-- create products table
CREATE TABLE Products (
  Id INT NOT NULL PRIMARY KEY,
  Name NVARCHAR(200) NOT NULL,
  Price INT NOT NULL,
  Category NVARCHAR(50) NOT NULL,
  Image NVARCHAR(300) NOT NULL,
  Tags NVARCHAR(400) NOT NULL,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE INDEX IX_Products_Category ON Products(Category)
-- sample data
INSERT INTO Products (Id, Name, Price, Category, Image, Tags)
VALUES
(1,  'Attack on Titan UNO', 1300, 'card',    '/images/attackOnTitanUNO.jpg', '["aot","uno"]'),
(2,  'Boku no Academia A3 Poster', 880, 'poster', '/images/bokuNoAcademiaA3Poster.jpg', '["mha","poster"]'),
(3,  'Jujutsu Kaisen Hidden Inventory Mini Shikishi Collection', 2750, 'card', '/images/jujutsuKaisenHiddenInventoryMiniSjikishiCollection.jpg', '["jjk","hidden-inventory"]'),
(4,  'Boku no Academia Villains Glass Style Trading Foiled Mini Shikishi', 1600, 'card', '/images/bokuNoAcademiaVillainsGlassStyleTradingFoiledMiniShikishi.jpg', '["mha","villains"]'),
(5,  'Jujutsu Kaisen UNO', 1300, 'card', '/images/jujutsuKaisenUNO.jpg', '["jjk","uno"]'),

(6,  'Chuya NuiPal Plush', 1980, 'plush', '/images/chuyaNuiPalPlush.jpg', '["bsd","chuya"]'),
(7,  'Dazai NuiPal Plush', 1980, 'plush', '/images/dazaiNuiPalPlush.jpg', '["bsd","dazai"]'),

(8,  'Dabi Stained Glass Acrylic Stand', 2090, 'stand', '/images/dabiStainedGlassStyleAcrylicStand.jpg', '["mha","dabi"]'),
(9,  'Hawks Acrylic Stand', 1690, 'stand', '/images/hawksAcrylicStand.jpg', '["mha","hawks"]'),
(10, 'Kentou Umbrella Acrylic Stand', 1560, 'stand', '/images/kentouUmbrellaAcrylicStand.jpg', '["jjk","nanami","kentou"]'),
(11, 'Satoru Amusement Park Acrylic Stand', 1980, 'stand', '/images/satoruAmusementParkAcrylicStand.jpg', '["jjk","gojo"]'),
(12, 'Shota Aizawa Acrylic Stand', 1780, 'stand', '/images/shotaAcrylicStand9.jpg', '["mha","aizawa"]'),
(13, 'Sukuna Pale Tone Acrylic Stand', 1480, 'stand', '/images/sunkunaPaleToneAcrylicStand.jpg', '["jjk","sukuna"]'),
(14, 'Satoru Okinawa Figure', 3550, 'figure', '/images/satoruOkinawaFigure.jpg', '["jjk","gojo","figure"]'),

(15, 'Cinnamoroll Acrylic Keychain', 860, 'keychain', '/images/cinnamorollAcrylicKeychain.jpg', '["sanrio","keychain"]'),
(16, 'Eren Chimikemo Mascot', 1980, 'mascot', '/images/erenChimikemoMascot.jpg', '["aot","eren"]'),
(17, 'Levi Chimikemo Mascot', 1980, 'mascot', '/images/leviChimikemoMascot.jpg', '["aot","levi"]'),
(18, 'Mikasa Chinikemo Masot', 1980, 'mascot', '/images/mikasaChinikemoMasot.jpg', '["aot","mikasa"]'),
(19, 'Miku Dango Masot Keychain', 1560, 'keychain', '/images/mikuDangoMasotKeychain.jpg', '["vocaloid","miku"]'),
(20, 'PomPomPurin Acrylic Keychain', 860, 'keychain', '/images/pomPomPurinAcrylicKeychain.jpg', '["sanrio","keychain"]'),
(21, 'Katsuki Slide Acrylic Keychain', 1100, 'keychain', '/images/katsukiSlideAcrylicKeychain.jpg', '["mha","bakugo"]'),
(22, 'Shoto Slide Acrylic Keychain', 1100, 'keychain', '/images/shotoSlideAcrylicKeychain.jpg', '["mha","todoroki"]'),

(23, 'Katsuki Sticker', 385, 'sticker', '/images/katsukiSticker.jpg', '["mha","bakugo"]'),
(24, 'Shoto Sticker', 385, 'sticker', '/images/shotoSticker.jpg', '["mha","todoroki"]'),
(25, 'Shota Sticker', 385, 'sticker', '/images/shotaSticker.jpg', '["mha","aizawa"]'),

(26, 'Suguru Hidden Inventory Postcard Set', 550, 'postcard', '/images/SuguruHiddenInnventoryPostcardSet.jpg', '["jjk","geto"]'),
(27, 'Satoru Hidden Inventory Postcard Set', 1650, 'postcard', '/images/satoruHiddenInventoryPostcardSet.jpg', '["jjk","gojo"]'),
(28, 'Satoru S2 Chara Badge Collection', 2640, 'badge', '/images/satoruS2CharaBadgeCollection.jpg', '["jjk","gojo"]'),
(29, 'Kento S2 Chara Badge Collection', 2640, 'badge', '/images/kentoS2CharaBadgeCollection.jpg', '["jjk","nanami"]'),
(30, 'Choso S2 Chara Badge Collection', 2640, 'badge', '/images/chosoS2CharaBadgeCollection.jpg', '["jjk","choso"]')

SELECT * FROM Products ORDER BY Id;
