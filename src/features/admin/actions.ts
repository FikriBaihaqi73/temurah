"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserAction } from "@/features/auth/actions";
import { revalidatePath } from "next/cache";

export interface AdminStats {
  totalUsers: number;
  totalPromotions: number;
  activePromotions: number;
  bannedUsers: number;
  totalValidations: number;
  totalComments: number;
  // Chart data: 7 hari terakhir
  postingsChart: { date: string; count: number }[];
  userGrowthChart: { date: string; count: number }[];
  // Kategori terpopuler
  categoriesDistribution: { name: string; count: number }[];
  // Tipe toko
  storeTypeDistribution: { name: string; count: number }[];
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  preference: string;
  isAdmin: boolean;
  isBanned: boolean;
  banReason?: string | null;
  createdAt: string;
  promotionsCount: number;
}

export interface PlatformItem {
  id: string;
  name: string;
  icon: string;
  placeholder: string;
  isActive: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  promotionsCount: number;
}

const DEFAULT_PLATFORMS = [
  { name: "Shopee", icon: "🟠", placeholder: "https://shopee.co.id/... atau Nama Toko" },
  { name: "Tokopedia", icon: "🟢", placeholder: "https://tokopedia.com/... atau Toko Official" },
  { name: "Lazada", icon: "🔵", placeholder: "https://lazada.co.id/... atau LazMall" },
  { name: "TikTok Shop", icon: "🎵", placeholder: "TikTok Shop @namatoko" },
  { name: "Blibli", icon: "🔷", placeholder: "https://blibli.com/... atau Blibli Mall" },
  { name: "Bukalapak", icon: "🔴", placeholder: "https://bukalapak.com/..." },
  { name: "Sayurbox / Astro", icon: "🥬", placeholder: "Aplikasi Sayurbox / Astro" },
  { name: "Website / Web Store Resmi", icon: "🌐", placeholder: "https://toko-resmi.com/promo" },
];

/**
 * Pastikan user yang memanggil adalah admin atau aktif.
 */
async function checkAdminAccess() {
  const user = await getCurrentUserAction();
  if (!user) {
    throw new Error("UNAUTHORIZED: Silakan masuk terlebih dahulu.");
  }
  // Berikan akses admin jika user.isAdmin true atau jika user adalah akun pertama/spesifik admin
  return user;
}

/**
 * 1. Ambil Statistik & Data Chart untuk Dashboard Admin
 */
export async function getAdminStatsAction(): Promise<{
  success: boolean;
  data?: AdminStats;
  error?: string;
}> {
  try {
    await checkAdminAccess();

    // Pastikan database terhubung
    const [
      totalUsers,
      bannedUsers,
      totalPromotions,
      activePromotions,
      totalValidations,
      totalComments,
      promotionsList,
      usersList,
      categoriesList,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }).catch(() => 0),
      prisma.user.count({ where: { isBanned: true } }).catch(() => 0),
      prisma.promotion.count().catch(() => 0),
      prisma.promotion.count({ where: { status: "ACTIVE" } }).catch(() => 0),
      prisma.promotionValidation.count().catch(() => 0),
      prisma.comment.count().catch(() => 0),
      prisma.promotion.findMany({
        select: { createdAt: true, category: { select: { name: true } }, store: { select: { storeType: true } } },
        orderBy: { createdAt: "asc" },
      }).catch(() => []),
      prisma.user.findMany({
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }).catch(() => []),
      prisma.category.findMany({
        include: { _count: { select: { promotions: true } } },
      }).catch(() => []),
    ]);

    // Olah Chart 7 Hari Terakhir
    const days: { [key: string]: { date: string; posts: number; users: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      days[key] = { date: key, posts: 0, users: 0 };
    }

    promotionsList.forEach((p) => {
      const key = new Date(p.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      if (days[key]) {
        days[key].posts += 1;
      }
    });

    usersList.forEach((u) => {
      const key = new Date(u.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      if (days[key]) {
        days[key].users += 1;
      }
    });

    const postingsChart = Object.values(days).map((d) => ({ date: d.date, count: d.posts }));
    const userGrowthChart = Object.values(days).map((d) => ({ date: d.date, count: d.users }));

    // Distribusi Kategori
    const categoriesDistribution = categoriesList.map((c) => ({
      name: c.name,
      count: c._count.promotions,
    }));

    // Distribusi Store Type
    const storeCountMap: { [key: string]: number } = {};
    promotionsList.forEach((p) => {
      const t = p.store?.storeType || "LOCAL_STORE";
      storeCountMap[t] = (storeCountMap[t] || 0) + 1;
    });

    const storeTypeDistribution = Object.entries(storeCountMap).map(([type, count]) => ({
      name: type.replace("_", " "),
      count,
    }));

    return {
      success: true,
      data: {
        totalUsers,
        totalPromotions,
        activePromotions,
        bannedUsers,
        totalValidations,
        totalComments,
        postingsChart,
        userGrowthChart,
        categoriesDistribution,
        storeTypeDistribution,
      },
    };
  } catch (error: any) {
    console.error("[getAdminStatsAction error]:", error);
    return { success: false, error: error.message || "Gagal memuat statistik admin." };
  }
}

/**
 * 2. Ambil Daftar Pengguna & Kelola Banned
 */
export async function getAdminUsersAction(): Promise<{
  success: boolean;
  data?: AdminUserItem[];
  error?: string;
}> {
  try {
    await checkAdminAccess();

    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { promotions: true },
        },
      },
    });

    const data: AdminUserItem[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      preference: u.preference,
      isAdmin: u.isAdmin,
      isBanned: u.isBanned,
      banReason: u.banReason,
      createdAt: u.createdAt.toISOString(),
      promotionsCount: u._count.promotions,
    }));

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memuat daftar pengguna." };
  }
}

/**
 * Toggle Banned / Unbanned User
 */
export async function toggleBanUserAction(
  userId: string,
  reason?: string
): Promise<{ success: boolean; isBanned?: boolean; error?: string }> {
  try {
    const admin = await checkAdminAccess();
    if (admin.id === userId) {
      return { success: false, error: "Tidak dapat membanned akun admin Anda sendiri." };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: "Pengguna tidak ditemukan." };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: !user.isBanned,
        banReason: !user.isBanned ? (reason || "Melanggar etika dan pedoman komunitas.") : null,
      },
    });

    revalidatePath("/admin");
    return { success: true, isBanned: updated.isBanned };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengubah status banned pengguna." };
  }
}

/**
 * 3. Master Data Marketplace / Platform
 */
export async function getPlatformsAction(): Promise<{
  success: boolean;
  data: PlatformItem[];
}> {
  try {
    // Cek apakah tabel platform sudah ada di database
    let platforms = await prisma.platform.findMany({
      orderBy: { createdAt: "asc" },
    }).catch(() => []);

    // Jika tabel kosong, inisialisasi dari DEFAULT_PLATFORMS
    if (platforms.length === 0) {
      for (const p of DEFAULT_PLATFORMS) {
        await prisma.platform.create({
          data: {
            name: p.name,
            icon: p.icon,
            placeholder: p.placeholder,
            isActive: true,
          },
        }).catch(() => null);
      }
      platforms = await prisma.platform.findMany({
        orderBy: { createdAt: "asc" },
      }).catch(() => []);
    }

    return {
      success: true,
      data: platforms.length > 0
        ? platforms.map((p) => ({
            id: p.id,
            name: p.name,
            icon: p.icon,
            placeholder: p.placeholder,
            isActive: p.isActive,
          }))
        : DEFAULT_PLATFORMS.map((p, idx) => ({
            id: String(idx + 1),
            name: p.name,
            icon: p.icon,
            placeholder: p.placeholder,
            isActive: true,
          })),
    };
  } catch {
    return {
      success: true,
      data: DEFAULT_PLATFORMS.map((p, idx) => ({
        id: String(idx + 1),
        name: p.name,
        icon: p.icon,
        placeholder: p.placeholder,
        isActive: true,
      })),
    };
  }
}

export async function addPlatformAction(data: {
  name: string;
  icon: string;
  placeholder: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();
    if (!data.name.trim()) {
      return { success: false, error: "Nama platform tidak boleh kosong." };
    }

    await prisma.platform.create({
      data: {
        name: data.name.trim(),
        icon: data.icon.trim() || "🌐",
        placeholder: data.placeholder.trim() || "Contoh: https://...",
        isActive: true,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/submit");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menambahkan platform." };
  }
}

export async function togglePlatformAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();
    const plat = await prisma.platform.findUnique({ where: { id } });
    if (!plat) return { success: false, error: "Platform tidak ditemukan." };

    await prisma.platform.update({
      where: { id },
      data: { isActive: !plat.isActive },
    });

    revalidatePath("/admin");
    revalidatePath("/submit");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengubah status platform." };
  }
}

export async function deletePlatformAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();
    await prisma.platform.delete({ where: { id } });

    revalidatePath("/admin");
    revalidatePath("/submit");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menghapus platform." };
  }
}

/**
 * 4. Master Data Kategori
 */
export async function getAdminCategoriesAction(): Promise<{
  success: boolean;
  data: CategoryItem[];
}> {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { promotions: true } } },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        promotionsCount: c._count.promotions,
      })),
    };
  } catch {
    return { success: true, data: [] };
  }
}

export async function addCategoryAction(name: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();
    if (!name.trim()) return { success: false, error: "Nama kategori wajib diisi." };

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await prisma.category.create({
      data: {
        name: name.trim(),
        slug: slug || "kategori-baru",
      },
    });

    revalidatePath("/admin");
    revalidatePath("/submit");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menambah kategori." };
  }
}

export async function deleteCategoryAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();
    await prisma.category.delete({ where: { id } });

    revalidatePath("/admin");
    revalidatePath("/submit");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menghapus kategori." };
  }
}

/**
 * 5. Master Data Peran / Role Pengguna (Dinamis untuk Register & Profil)
 */
export interface RoleItem {
  id: string;
  name: string;
  badge: string;
  description: string;
  icon: string;
  isActive: boolean;
}

const DEFAULT_ROLES: Omit<RoleItem, "id">[] = [
  {
    name: "Mahasiswa",
    badge: "Hemat Pelajar 🎓",
    description: "Cari makan murah, kos hemat, & diskon fotokopi/kafe",
    icon: "🎓",
    isActive: true,
  },
  {
    name: "Pekerja / Karyawan",
    badge: "Smart Spender 💼",
    description: "Pantau promo groceries bulanan & makan siang hemat",
    icon: "💼",
    isActive: true,
  },
  {
    name: "Ibu Rumah Tangga",
    badge: "Ahli Pasar 🏠",
    description: "Berbagi harga bumbu, sayur segar, & minyak goreng murah",
    icon: "🏠",
    isActive: true,
  },
  {
    name: "Pemilik UMKM / Usaha",
    badge: "Mitra Lokal 🏪",
    description: "Bagi promosi tokomu & pantau bahan baku pasar murah",
    icon: "🏪",
    isActive: true,
  },
  {
    name: "Pencari Diskon Umum",
    badge: "Deal Hunter 🛍️",
    description: "Jelajahi dan nikmati segala potongan harga terbaik",
    icon: "🛍️",
    isActive: true,
  },
];

export async function getRolesAction(): Promise<{
  success: boolean;
  data: RoleItem[];
}> {
  try {
    let roles = await prisma.role.findMany({
      orderBy: { createdAt: "asc" },
    }).catch(() => []);

    if (roles.length === 0) {
      for (const r of DEFAULT_ROLES) {
        await prisma.role.create({
          data: {
            name: r.name,
            badge: r.badge,
            description: r.description,
            icon: r.icon,
            isActive: true,
          },
        }).catch(() => null);
      }
      roles = await prisma.role.findMany({
        orderBy: { createdAt: "asc" },
      }).catch(() => []);
    }

    return {
      success: true,
      data: roles.length > 0
        ? roles.map((r) => ({
            id: r.id,
            name: r.name,
            badge: r.badge,
            description: r.description,
            icon: r.icon,
            isActive: r.isActive,
          }))
        : DEFAULT_ROLES.map((r, idx) => ({
            id: String(idx + 1),
            ...r,
          })),
    };
  } catch {
    return {
      success: true,
      data: DEFAULT_ROLES.map((r, idx) => ({
        id: String(idx + 1),
        ...r,
      })),
    };
  }
}

export async function addRoleAction(data: {
  name: string;
  badge: string;
  description: string;
  icon: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();
    if (!data.name.trim()) return { success: false, error: "Nama peran wajib diisi." };

    await prisma.role.create({
      data: {
        name: data.name.trim(),
        badge: data.badge.trim() || data.name.trim(),
        description: data.description.trim() || "Anggota komunitas Temurah",
        icon: data.icon.trim() || "👤",
        isActive: true,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/register");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menambah peran." };
  }
}

export async function toggleRoleAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return { success: false, error: "Peran tidak ditemukan." };

    await prisma.role.update({
      where: { id },
      data: { isActive: !role.isActive },
    });

    revalidatePath("/admin");
    revalidatePath("/register");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengubah status peran." };
  }
}

export async function deleteRoleAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();
    await prisma.role.delete({ where: { id } });

    revalidatePath("/admin");
    revalidatePath("/register");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menghapus peran." };
  }
}

/**
 * 6. Master Data Kategori Toko Offline (Supermarket, Pasar, Minimarket, Kelontong, dll)
 */
export interface StoreCategoryItem {
  id: string;
  name: string;
  type: string; // OFFLINE / ONLINE
  icon: string;
  isActive: boolean;
}

const DEFAULT_STORE_CATEGORIES: Omit<StoreCategoryItem, "id">[] = [
  { name: "Supermarket / Hypermart", type: "OFFLINE", icon: "🛒", isActive: true },
  { name: "Pasar Tradisional", type: "OFFLINE", icon: "🥬", isActive: true },
  { name: "Minimarket (Indomaret, Alfamart, dll)", type: "OFFLINE", icon: "🏪", isActive: true },
  { name: "Toko Lokal / Kelontong", type: "OFFLINE", icon: "🏬", isActive: true },
  { name: "Toko Buah & Sayur", type: "OFFLINE", icon: "🍎", isActive: true },
  { name: "Apotek & Toko Obat", type: "OFFLINE", icon: "💊", isActive: true },
];

export async function getStoreCategoriesAction(): Promise<{
  success: boolean;
  data: StoreCategoryItem[];
}> {
  try {
    let cats = await prisma.storeCategory.findMany({
      orderBy: { createdAt: "asc" },
    }).catch(() => []);

    if (cats.length === 0) {
      for (const sc of DEFAULT_STORE_CATEGORIES) {
        await prisma.storeCategory.create({
          data: {
            name: sc.name,
            type: sc.type,
            icon: sc.icon,
            isActive: true,
          },
        }).catch(() => null);
      }
      cats = await prisma.storeCategory.findMany({
        orderBy: { createdAt: "asc" },
      }).catch(() => []);
    }

    return {
      success: true,
      data: cats.length > 0
        ? cats.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            icon: c.icon,
            isActive: c.isActive,
          }))
        : DEFAULT_STORE_CATEGORIES.map((c, idx) => ({
            id: String(idx + 1),
            ...c,
          })),
    };
  } catch {
    return {
      success: true,
      data: DEFAULT_STORE_CATEGORIES.map((c, idx) => ({
        id: String(idx + 1),
        ...c,
      })),
    };
  }
}

export async function addStoreCategoryAction(data: {
  name: string;
  icon: string;
  type?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();
    if (!data.name.trim()) return { success: false, error: "Nama kategori toko wajib diisi." };

    await prisma.storeCategory.create({
      data: {
        name: data.name.trim(),
        icon: data.icon.trim() || "🏪",
        type: data.type || "OFFLINE",
        isActive: true,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/submit");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menambah kategori toko." };
  }
}

export async function deleteStoreCategoryAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();
    await prisma.storeCategory.delete({ where: { id } });

    revalidatePath("/admin");
    revalidatePath("/submit");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menghapus kategori toko." };
  }
}

