import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { 
  UserPreference, 
  StoreType, 
  PromotionStatus, 
  StockCondition, 
  ValidationType 
} from "../src/generated/prisma/enums";

async function main() {
  console.log("🌱 Starting Temurah database seed...");

  // 1. SEED CATEGORIES (8 Kategori Resmi dari Frontend)
  const categoriesData = [
    { name: "Kebutuhan Pokok", slug: "kebutuhan-pokok" },
    { name: "Sayur & Bumbu", slug: "sayur-bumbu" },
    { name: "Minuman & Susu", slug: "minuman-susu" },
    { name: "Pembersih Rumah", slug: "pembersih-rumah" },
    { name: "Daging & Ikan", slug: "daging-ikan" },
    { name: "Camilan & Roti", slug: "camilan-roti" },
    { name: "Perlengkapan Bayi", slug: "perlengkapan-bayi" },
    { name: "Lainnya", slug: "lainnya" },
  ];

  console.log("-> Seeding categories...");
  const categories: Record<string, { id: string; name: string }> = {};
  for (const cat of categoriesData) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    });
    categories[cat.name] = record;
  }

  // 2. SEED USERS (Sample Users mewakili 5 Persona)
  console.log("-> Seeding sample users...");
  const usersData = [
    {
      email: "budi@example.com",
      name: "Budi Santoso",
      preference: UserPreference.WORKER,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    },
    {
      email: "siti@example.com",
      name: "Siti Rahma",
      preference: UserPreference.HOUSEWIFE,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    },
    {
      email: "dimas@example.com",
      name: "Dimas Anggara",
      preference: UserPreference.STUDENT,
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
    },
    {
      email: "rina@example.com",
      name: "Rina Kusuma",
      preference: UserPreference.HOUSEWIFE,
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
    },
    {
      email: "eko@example.com",
      name: "Eko Prasetyo",
      preference: UserPreference.MSME_OWNER,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    },
    {
      email: "arif@example.com",
      name: "Arif Hidayat",
      preference: UserPreference.GENERAL,
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    },
  ];

  const dummyPasswordHash = "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfI.C2"; // dummy hash
  const users: Record<string, { id: string; name: string }> = {};

  for (const u of usersData) {
    const record = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        preference: u.preference,
        avatarUrl: u.avatarUrl,
      },
      create: {
        email: u.email,
        name: u.name,
        passwordHash: dummyPasswordHash,
        preference: u.preference,
        avatarUrl: u.avatarUrl,
      },
    });
    users[u.email] = record;
  }

  // 3. SEED STORES (Toko di Area Yogyakarta & Sleman)
  console.log("-> Seeding stores...");
  const storesData = [
    {
      name: "Superindo Kaliurang",
      storeType: StoreType.SUPERMARKET,
      address: "Jl. Kaliurang KM 6.2 No. 18, Manggung, Caturtunggal, Sleman, D.I. Yogyakarta 55281",
      latitude: -7.7554,
      longitude: 110.3812,
      createdByUserId: users["budi@example.com"].id,
    },
    {
      name: "Pasar Kranggan (Kios Bu Siti)",
      storeType: StoreType.TRADITIONAL_MARKET,
      address: "Lantai 1 Blok B2 No. 14 Pasar Kranggan, Jl. Poncowinatan, Gowongan, Jetis, Yogyakarta",
      latitude: -7.7829,
      longitude: 110.3671,
      createdByUserId: users["siti@example.com"].id,
    },
    {
      name: "Indomaret Point Colombo",
      storeType: StoreType.MINIMARKET,
      address: "Jl. Colombo No. 3, Caturtunggal, Depok, Sleman (Dekat UNY)",
      latitude: -7.7749,
      longitude: 110.3871,
      createdByUserId: users["dimas@example.com"].id,
    },
    {
      name: "Mirota Kampus Babarsari",
      storeType: StoreType.SUPERMARKET,
      address: "Jl. Raya Babarsari No. 10, Caturtunggal, Depok, Sleman",
      latitude: -7.7816,
      longitude: 110.4143,
      createdByUserId: users["rina@example.com"].id,
    },
    {
      name: "Toko Sembako Berkah Lancar",
      storeType: StoreType.LOCAL_STORE,
      address: "Jl. Affandi No. 12, Santren, Caturtunggal, Sleman",
      latitude: -7.7712,
      longitude: 110.3925,
      createdByUserId: users["eko@example.com"].id,
    },
    {
      name: "Pasar Colombo (Los Beras B4)",
      storeType: StoreType.TRADITIONAL_MARKET,
      address: "Pasar Colombo Los B4, Jl. Kaliurang KM 7.2, Condongcatur, Sleman",
      latitude: -7.7478,
      longitude: 110.3834,
      createdByUserId: users["arif@example.com"].id,
    },
  ];

  const stores: Record<string, { id: string; name: string }> = {};
  for (const s of storesData) {
    let existing = await prisma.store.findFirst({
      where: { name: s.name, address: s.address },
    });
    if (!existing) {
      existing = await prisma.store.create({
        data: s,
      });
    }
    stores[s.name] = existing;
  }

  // 4. SEED PROMOTIONS
  console.log("-> Seeding promotions...");
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fiveDaysLater = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const tomorrowNight = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  tomorrowNight.setHours(23, 59, 0, 0);

  const promosData = [
    {
      productName: "Minyak Goreng Sania Pouch 2L Hemat Mingguan",
      categoryName: "Kebutuhan Pokok",
      storeName: "Superindo Kaliurang",
      contributorEmail: "budi@example.com",
      normalPrice: 38900,
      discountPrice: 28500,
      description: "Maksimal pembelian 2 pouch per struk member. Stok di lorong tengah masih 2 kardus tadi jam 09.00.",
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=700&auto=format&fit=crop&q=80",
      stockCondition: StockCondition.PLENTY,
      status: PromotionStatus.VERIFIED,
      endsAt: tomorrowNight,
    },
    {
      productName: "Cabai Rawit Merah Segar (Harga Petani Langsung)",
      categoryName: "Sayur & Bumbu",
      storeName: "Pasar Kranggan (Kios Bu Siti)",
      contributorEmail: "siti@example.com",
      normalPrice: 75000,
      discountPrice: 48000,
      description: "Kondisi cabai masih segar dan tangkai hijau. Datang sebelum jam 11 siang karena cepat habis.",
      imageUrl: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=700&auto=format&fit=crop&q=80",
      stockCondition: StockCondition.LIMITED,
      status: PromotionStatus.VERIFIED,
      endsAt: tomorrowNight,
    },
    {
      productName: "Susu UHT Ultra Milk 1000ml Full Cream",
      categoryName: "Minuman & Susu",
      storeName: "Indomaret Point Colombo",
      contributorEmail: "dimas@example.com",
      normalPrice: 21500,
      discountPrice: 16900,
      description: "Beli 2 lebih hemat potongan langsung di kasir.",
      imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=700&auto=format&fit=crop&q=80",
      stockCondition: StockCondition.PLENTY,
      status: PromotionStatus.ACTIVE,
      endsAt: threeDaysLater,
    },
    {
      productName: "Deterjen Cair Rinso Matic Konsentrat 1.5kg",
      categoryName: "Pembersih Rumah",
      storeName: "Mirota Kampus Babarsari",
      contributorEmail: "rina@example.com",
      normalPrice: 44000,
      discountPrice: 29900,
      description: "Potongan harga label kuning khusus varian Front Load & Top Load.",
      imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=700&auto=format&fit=crop&q=80",
      stockCondition: StockCondition.PLENTY,
      status: PromotionStatus.VERIFIED,
      endsAt: fiveDaysLater,
    },
    {
      productName: "Telur Ayam Ras Segar 1 Kg (Kondisi Bersih)",
      categoryName: "Kebutuhan Pokok",
      storeName: "Toko Sembako Berkah Lancar",
      contributorEmail: "eko@example.com",
      normalPrice: 31000,
      discountPrice: 25000,
      description: "Bisa pilih sendiri dan ditimbang langsung di depan pembeli.",
      imageUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=700&auto=format&fit=crop&q=80",
      stockCondition: StockCondition.LIMITED,
      status: PromotionStatus.ACTIVE,
      endsAt: threeDaysLater,
    },
    {
      productName: "Beras Rojolele Delanggu 5Kg Pulen Asli",
      categoryName: "Kebutuhan Pokok",
      storeName: "Pasar Colombo (Los Beras B4)",
      contributorEmail: "arif@example.com",
      normalPrice: 78000,
      discountPrice: 66000,
      description: "Beras panen baru Delanggu, putih alami tanpa pemutih sintetis.",
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop&q=80",
      stockCondition: StockCondition.LOW,
      status: PromotionStatus.ACTIVE,
      endsAt: fiveDaysLater,
    },
  ];

  const promotions: Record<string, { id: string }> = {};

  for (const p of promosData) {
    let promo = await prisma.promotion.findFirst({
      where: {
        productName: p.productName,
        storeId: stores[p.storeName].id,
      },
    });

    if (!promo) {
      promo = await prisma.promotion.create({
        data: {
          productName: p.productName,
          description: p.description,
          normalPrice: p.normalPrice,
          discountPrice: p.discountPrice,
          imageUrl: p.imageUrl,
          stockCondition: p.stockCondition,
          status: p.status,
          endsAt: p.endsAt,
          categoryId: categories[p.categoryName].id,
          storeId: stores[p.storeName].id,
          createdByUserId: users[p.contributorEmail].id,
        },
      });
    }
    promotions[p.productName] = promo;
  }

  // 5. SEED VALIDATIONS & LOGS
  console.log("-> Seeding validations & comments...");
  const oilPromo = promotions["Minyak Goreng Sania Pouch 2L Hemat Mingguan"];
  if (oilPromo) {
    // Validasi oleh Siti & Dimas
    await prisma.promotionValidation.upsert({
      where: {
        promotionId_userId: {
          promotionId: oilPromo.id,
          userId: users["siti@example.com"].id,
        },
      },
      update: { validationType: ValidationType.VALID },
      create: {
        promotionId: oilPromo.id,
        userId: users["siti@example.com"].id,
        validationType: ValidationType.VALID,
        note: "Masih dapat 2 pouch tadi jam 10.30",
      },
    });

    // Komentar diskusi
    const existingComment = await prisma.comment.findFirst({
      where: {
        promotionId: oilPromo.id,
        userId: users["siti@example.com"].id,
      },
    });
    if (!existingComment) {
      await prisma.comment.create({
        data: {
          promotionId: oilPromo.id,
          userId: users["siti@example.com"].id,
          content: "Baru saja lewat jam 10.30 masih dapat 2 pouch, antrean kasir 3 orang.",
        },
      });
    }
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
