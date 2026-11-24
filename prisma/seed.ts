import "dotenv/config";
import * as bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { UserPreference } from "../src/generated/prisma/enums";

async function main() {
  console.log("🌱 Starting Temurah master data seed...\n");

  // ==========================================
  // 1. SEED AKUN ADMINISTRATOR DARI ENV
  // ==========================================
  const adminEmail = process.env.ADMIN_EMAIL || "admin@temurah.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "adminpassword123";
  const adminName = process.env.ADMIN_NAME || "Administrator Temurah";

  console.log(`-> Seeding Admin account (${adminEmail})...`);
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      isAdmin: true,
      passwordHash: adminPasswordHash,
      isBanned: false,
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash: adminPasswordHash,
      preference: UserPreference.GENERAL,
      isAdmin: true,
      isBanned: false,
      avatarUrl: null,
    },
  });
  console.log(`   [✓] Akun Admin siap: ${adminUser.email} (isAdmin: ${adminUser.isAdmin})`);

  // ==========================================
  // 2. SEED MASTER PLATFORM E-COMMERCE / ONLINE
  // ==========================================
  console.log("-> Seeding master online platforms...");
  const platformsData = [
    { name: "Shopee", icon: "🟠", placeholder: "Contoh: https://shopee.co.id/... atau Nama Toko Official" },
    { name: "Tokopedia", icon: "🟢", placeholder: "Contoh: https://tokopedia.com/... atau Tokopedia Official Store" },
    { name: "Lazada", icon: "🔵", placeholder: "Contoh: https://lazada.co.id/... atau LazMall" },
    { name: "TikTok Shop", icon: "🎵", placeholder: "Contoh: TikTok Shop @namatoko" },
    { name: "Blibli", icon: "🔷", placeholder: "Contoh: https://blibli.com/... atau Blibli Mall" },
    { name: "Bukalapak", icon: "🔴", placeholder: "Contoh: https://bukalapak.com/..." },
    { name: "Sayurbox / Astro", icon: "🥬", placeholder: "Aplikasi Sayurbox / Astro Quick Commerce" },
    { name: "Website / Web Store Resmi", icon: "🌐", placeholder: "Contoh: https://toko-resmi.com/promo" },
  ];

  for (const p of platformsData) {
    await prisma.platform.upsert({
      where: { name: p.name },
      update: { icon: p.icon, placeholder: p.placeholder, isActive: true },
      create: { name: p.name, icon: p.icon, placeholder: p.placeholder, isActive: true },
    });
  }
  console.log(`   [✓] ${platformsData.length} master platform online tersimpan.`);

  // ==========================================
  // 3. SEED MASTER KATEGORI TOKO OFFLINE / FISIK
  // ==========================================
  console.log("-> Seeding master offline store categories...");
  const storeCategoriesData = [
    { name: "Supermarket / Hypermart", type: "OFFLINE", icon: "🛒" },
    { name: "Pasar Tradisional", type: "OFFLINE", icon: "🥬" },
    { name: "Minimarket (Indomaret, Alfamart, dll)", type: "OFFLINE", icon: "🏪" },
    { name: "Toko Lokal / Kelontong", type: "OFFLINE", icon: "🏬" },
    { name: "Toko Buah & Sayur", type: "OFFLINE", icon: "🍎" },
    { name: "Apotek & Toko Obat", type: "OFFLINE", icon: "💊" },
  ];

  for (const sc of storeCategoriesData) {
    await prisma.storeCategory.upsert({
      where: { name: sc.name },
      update: { type: sc.type, icon: sc.icon, isActive: true },
      create: { name: sc.name, type: sc.type, icon: sc.icon, isActive: true },
    });
  }
  console.log(`   [✓] ${storeCategoriesData.length} master kategori toko offline tersimpan.`);

  // ==========================================
  // 4. SEED MASTER PERAN / ROLE KOMUNITAS
  // ==========================================
  console.log("-> Seeding master community roles...");
  const rolesData = [
    {
      name: "Mahasiswa",
      badge: "Hemat Pelajar 🎓",
      description: "Cari makan murah, kos hemat, & diskon fotokopi/kafe",
      icon: "🎓",
    },
    {
      name: "Pekerja / Karyawan",
      badge: "Smart Spender 💼",
      description: "Pantau promo groceries bulanan & makan siang hemat",
      icon: "💼",
    },
    {
      name: "Ibu Rumah Tangga",
      badge: "Ahli Pasar 🏠",
      description: "Berbagi harga bumbu, sayur segar, & minyak goreng murah",
      icon: "🏠",
    },
    {
      name: "Pemilik UMKM / Usaha",
      badge: "Mitra Lokal 🏪",
      description: "Bagi promosi tokomu & pantau bahan baku pasar murah",
      icon: "🏪",
    },
    {
      name: "Pencari Diskon Umum",
      badge: "Deal Hunter 🛍️",
      description: "Jelajahi dan nikmati segala potongan harga terbaik",
      icon: "🛍️",
    },
  ];

  for (const r of rolesData) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { badge: r.badge, description: r.description, icon: r.icon, isActive: true },
      create: { name: r.name, badge: r.badge, description: r.description, icon: r.icon, isActive: true },
    });
  }
  console.log(`   [✓] ${rolesData.length} master peran komunitas tersimpan.`);

  // ==========================================
  // 5. SEED MASTER KATEGORI PRODUK
  // ==========================================
  console.log("-> Seeding master product categories...");
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

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    });
  }
  console.log(`   [✓] ${categoriesData.length} master kategori produk tersimpan.`);

  console.log("\n==========================================");
  console.log("🎉 SEED MASTER DATA SELESAI!");
  console.log("==========================================");
  console.log("Kredensial Akun Administrator:");
  console.log(`📧 Email   : ${adminEmail}`);
  console.log(`🔑 Password: ${adminPassword}`);
  console.log("==========================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
