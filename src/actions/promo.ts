"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAction } from "@/actions/auth";
import {
  createPromotionSchema,
  updatePromotionSchema,
  mapFrontendToStoreType,
  mapStoreTypeToFrontend,
  mapFrontendToStockCondition,
  type CreatePromotionInput,
  type UpdatePromotionInput,
} from "@/validations/promo";
import { preferenceToRoleAndBadge } from "@/lib/auth-session";
import type { PromoPost, PromoComment } from "@/lib/mock-data";
import { PromotionStatus } from "@/generated/prisma/enums";

// Pusat koordinat standar area Yogyakarta / Sleman untuk hitung jarak
const DEFAULT_USER_LAT = -7.7829;
const DEFAULT_USER_LNG = 110.3671;

/**
 * Helper: Hitung jarak Haversine antara dua koordinat geolokasi.
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): string {
  const R = 6371; // Radius bumi dalam KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  if (d < 1) {
    return `${Math.round(d * 1000)} m`;
  }
  return `${d.toFixed(1)} km`;
}

/**
 * Helper: Format sisa masa berlaku promo ramah pengguna.
 */
function formatValidUntil(endsAt: Date): string {
  const now = new Date();
  const diffMs = endsAt.getTime() - now.getTime();
  if (diffMs <= 0) return "Sudah berakhir";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  const isToday =
    endsAt.getDate() === now.getDate() &&
    endsAt.getMonth() === now.getMonth() &&
    endsAt.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    endsAt.getDate() === tomorrow.getDate() &&
    endsAt.getMonth() === tomorrow.getMonth() &&
    endsAt.getFullYear() === tomorrow.getFullYear();

  const timeStr = endsAt.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return `Hari ini s/d ${timeStr}`;
  if (isTomorrow) return `Besok, ${timeStr}`;
  if (diffDays <= 7) return `${diffDays} Hari lagi`;

  return endsAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Helper: Format waktu lampau untuk komentar warga.
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} hari lalu`;
  return date.toLocaleDateString("id-ID");
}

export type PromoActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Server Action: Membuat promosi baru (Create Promotion).
 * Memerlukan user terautentikasi melalui session cookie.
 */
export async function createPromotionAction(
  data: CreatePromotionInput
): Promise<PromoActionResult<{ id: string }>> {
  try {
    // 1. Verifikasi autentikasi user dari session cookie
    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      return {
        success: false,
        error: "UNAUTHORIZED: Anda harus masuk terlebih dahulu untuk membagikan promo ke warga.",
      };
    }

    // 2. Validasi input menggunakan Zod
    const validation = createPromotionSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Input tidak valid.";
      return { success: false, error: firstError };
    }

    const input = validation.data;

    // 3. Gabungkan expiryDate dan expiryTime menjadi objek Date endsAt
    const [year, month, day] = input.expiryDate.split("-").map(Number);
    const [hour, minute] = input.expiryTime.split(":").map(Number);
    const endsAt = new Date(year, month - 1, day, hour, minute, 0, 0);

    if (endsAt <= new Date()) {
      return {
        success: false,
        error: "Batas waktu kedaluwarsa promo harus berada di masa mendatang.",
      };
    }

    // 4. Cari atau buat Kategori yang sesuai
    let category = await prisma.category.findFirst({
      where: {
        name: { equals: input.category.trim(), mode: "insensitive" },
      },
    });

    if (!category) {
      const slug = input.category
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      category = await prisma.category.upsert({
        where: { slug: slug || "lainnya" },
        update: { name: input.category.trim() },
        create: { name: input.category.trim(), slug: slug || "lainnya" },
      });
    }

    // 5. Cari atau gunakan Toko yang sudah ada untuk menghindari duplikasi
    const storeTypeEnum = mapFrontendToStoreType(input.storeType);
    let store = await prisma.store.findFirst({
      where: {
        name: { equals: input.storeName.trim(), mode: "insensitive" },
        address: { equals: input.address.trim(), mode: "insensitive" },
      },
    });

    if (!store) {
      store = await prisma.store.create({
        data: {
          name: input.storeName.trim(),
          storeType: storeTypeEnum,
          address: input.address.trim(),
          latitude: input.lat,
          longitude: input.lng,
          createdByUserId: currentUser.id,
        },
      });
    }

    // 6. Simpan Promosi ke Database
    const stockConditionEnum = mapFrontendToStockCondition(input.stockCondition);
    const normalPrice = input.originalPrice > 0 ? input.originalPrice : input.promoPrice;

    const newPromotion = await prisma.promotion.create({
      data: {
        storeId: store.id,
        categoryId: category.id,
        createdByUserId: currentUser.id,
        productName: input.title,
        description: input.notes?.trim() || null,
        normalPrice,
        discountPrice: input.promoPrice,
        imageUrl: input.imageUrl,
        stockCondition: stockConditionEnum,
        startsAt: new Date(),
        endsAt,
        status: PromotionStatus.ACTIVE,
      },
    });

    // Revalidate katalog halaman depan
    revalidatePath("/");

    return {
      success: true,
      data: { id: newPromotion.id },
    };
  } catch (error) {
    console.error("[createPromotionAction error]:", error);
    return {
      success: false,
      error: "Terjadi kesalahan pada server saat membagikan promo. Silakan coba lagi.",
    };
  }
}

/**
 * Server Action: Mengambil seluruh daftar promosi untuk katalog warga (Read Promotion).
 * Dapat diakses oleh publik (guest) maupun pengguna terdaftar.
 */
export async function getPromotionsAction(filters?: {
  category?: string;
  storeType?: string;
  searchQuery?: string;
}): Promise<PromoActionResult<PromoPost[]>> {
  try {
    const whereClause: Record<string, unknown> = {
      status: { in: [PromotionStatus.ACTIVE, PromotionStatus.VERIFIED] },
    };

    if (filters?.category && filters.category !== "all") {
      whereClause.category = {
        name: { equals: filters.category, mode: "insensitive" },
      };
    }

    if (filters?.storeType && filters.storeType !== "Semua Toko") {
      whereClause.store = {
        storeType: mapFrontendToStoreType(filters.storeType),
      };
    }

    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim();
      whereClause.OR = [
        { productName: { contains: q, mode: "insensitive" } },
        { store: { name: { contains: q, mode: "insensitive" } } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    // Query ke PostgreSQL via Prisma
    const promotions = await prisma.promotion.findMany({
      where: whereClause,
      include: {
        store: true,
        category: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            preference: true,
          },
        },
        validations: {
          select: {
            validationType: true,
          },
        },
        comments: {
          take: 3,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                preference: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const defaultAvatar =
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";

    // Transform ke struktur PromoPost yang diharapkan Frontend
    const mappedPromos: PromoPost[] = promotions.map((promo) => {
      const origPrice = promo.normalPrice;
      const promoPrice = promo.discountPrice;
      const discountPercentage =
        origPrice > promoPrice && origPrice > 0
          ? Math.round(((origPrice - promoPrice) / origPrice) * 100)
          : 0;

      const { badge: contributorBadge } = preferenceToRoleAndBadge(
        promo.createdByUser.preference
      );

      const confirmedCount = promo.validations.filter(
        (v) => v.validationType === "VALID"
      ).length;
      const expiredReportsCount = promo.validations.filter(
        (v) => v.validationType === "INVALID" || v.validationType === "EXPIRED"
      ).length;

      const comments: PromoComment[] = promo.comments.map((c) => {
        const { badge: commentBadge } = preferenceToRoleAndBadge(c.user.preference);
        return {
          id: c.id,
          userName: c.user.name,
          userAvatar: c.user.avatarUrl || defaultAvatar,
          badge: commentBadge,
          content: c.content,
          timeAgo: formatTimeAgo(c.createdAt),
          isVerifiedBuyer: true,
        };
      });

      const distance = calculateDistance(
        DEFAULT_USER_LAT,
        DEFAULT_USER_LNG,
        promo.store.latitude,
        promo.store.longitude
      );

      return {
        id: promo.id,
        title: promo.productName,
        category: promo.category.name,
        storeName: promo.store.name,
        storeType: mapStoreTypeToFrontend(promo.store.storeType),
        location: promo.store.address.split(",")[0] || promo.store.name,
        address: promo.store.address,
        lat: promo.store.latitude,
        lng: promo.store.longitude,
        distance,
        originalPrice: origPrice,
        promoPrice,
        discountPercentage,
        validUntil: formatValidUntil(promo.endsAt),
        notes: promo.description || "",
        imageUrl: promo.imageUrl,
        contributor: {
          name: promo.createdByUser.name,
          avatar: promo.createdByUser.avatarUrl || defaultAvatar,
          badge: contributorBadge,
        },
        confirmedCount,
        expiredReportsCount,
        commentsCount: promo._count.comments,
        comments,
        isHot: confirmedCount >= 10 || discountPercentage >= 25,
      };
    });

    return {
      success: true,
      data: mappedPromos,
    };
  } catch (error) {
    console.error("[getPromotionsAction error]:", error);
    return {
      success: false,
      error: "Gagal memuat katalog promo dari server.",
    };
  }
}

/**
 * Server Action: Mengambil detail satu promosi berdasarkan ID (Read Detail).
 */
export async function getPromotionDetailAction(
  id: string
): Promise<PromoActionResult<PromoPost>> {
  try {
    const promo = await prisma.promotion.findUnique({
      where: { id },
      include: {
        store: true,
        category: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            preference: true,
          },
        },
        validations: {
          select: {
            validationType: true,
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                preference: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!promo) {
      return {
        success: false,
        error: "Promosi tidak ditemukan atau telah dihapus.",
      };
    }

    const defaultAvatar =
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";
    const origPrice = promo.normalPrice;
    const promoPrice = promo.discountPrice;
    const discountPercentage =
      origPrice > promoPrice && origPrice > 0
        ? Math.round(((origPrice - promoPrice) / origPrice) * 100)
        : 0;

    const { badge: contributorBadge } = preferenceToRoleAndBadge(
      promo.createdByUser.preference
    );

    const confirmedCount = promo.validations.filter(
      (v) => v.validationType === "VALID"
    ).length;
    const expiredReportsCount = promo.validations.filter(
      (v) => v.validationType === "INVALID" || v.validationType === "EXPIRED"
    ).length;

    const comments: PromoComment[] = promo.comments.map((c) => {
      const { badge: commentBadge } = preferenceToRoleAndBadge(c.user.preference);
      return {
        id: c.id,
        userName: c.user.name,
        userAvatar: c.user.avatarUrl || defaultAvatar,
        badge: commentBadge,
        content: c.content,
        timeAgo: formatTimeAgo(c.createdAt),
        isVerifiedBuyer: true,
      };
    });

    const distance = calculateDistance(
      DEFAULT_USER_LAT,
      DEFAULT_USER_LNG,
      promo.store.latitude,
      promo.store.longitude
    );

    const promoPost: PromoPost = {
      id: promo.id,
      title: promo.productName,
      category: promo.category.name,
      storeName: promo.store.name,
      storeType: mapStoreTypeToFrontend(promo.store.storeType),
      location: promo.store.address.split(",")[0] || promo.store.name,
      address: promo.store.address,
      lat: promo.store.latitude,
      lng: promo.store.longitude,
      distance,
      originalPrice: origPrice,
      promoPrice,
      discountPercentage,
      validUntil: formatValidUntil(promo.endsAt),
      notes: promo.description || "",
      imageUrl: promo.imageUrl,
      contributor: {
        name: promo.createdByUser.name,
        avatar: promo.createdByUser.avatarUrl || defaultAvatar,
        badge: contributorBadge,
      },
      confirmedCount,
      expiredReportsCount,
      commentsCount: promo._count.comments,
      comments,
      isHot: confirmedCount >= 10 || discountPercentage >= 25,
    };

    return {
      success: true,
      data: promoPost,
    };
  } catch (error) {
    console.error("[getPromotionDetailAction error]:", error);
    return {
      success: false,
      error: "Gagal memuat rincian promosi.",
    };
  }
}

/**
 * Server Action: Mengubah data promosi (Update Promotion).
 * Hanya dapat dilakukan oleh pemilik/pembuat promosi tersebut.
 */
export async function updatePromotionAction(
  id: string,
  data: UpdatePromotionInput
): Promise<PromoActionResult<{ id: string }>> {
  try {
    // 1. Verifikasi pengguna login
    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      return {
        success: false,
        error: "UNAUTHORIZED: Anda harus masuk terlebih dahulu.",
      };
    }

    // 2. Ambil promosi yang ada dan periksa kepemilikan
    const existingPromo = await prisma.promotion.findUnique({
      where: { id },
      include: { store: true, category: true },
    });

    if (!existingPromo) {
      return {
        success: false,
        error: "Promosi tidak ditemukan.",
      };
    }

    if (existingPromo.createdByUserId !== currentUser.id) {
      return {
        success: false,
        error: "FORBIDDEN: Anda hanya dapat mengubah promosi yang Anda unggah sendiri.",
      };
    }

    // 3. Validasi perubahan data via Zod
    const validation = updatePromotionSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Input tidak valid.";
      return { success: false, error: firstError };
    }

    const input = validation.data;

    // 4. Update toko jika nama atau alamat diubah
    let storeId = existingPromo.storeId;
    if (
      (input.storeName && input.storeName !== existingPromo.store.name) ||
      (input.address && input.address !== existingPromo.store.address)
    ) {
      const updatedStoreName = input.storeName || existingPromo.store.name;
      const updatedAddress = input.address || existingPromo.store.address;
      const updatedStoreType = input.storeType
        ? mapFrontendToStoreType(input.storeType)
        : existingPromo.store.storeType;

      let targetStore = await prisma.store.findFirst({
        where: {
          name: { equals: updatedStoreName.trim(), mode: "insensitive" },
          address: { equals: updatedAddress.trim(), mode: "insensitive" },
        },
      });

      if (!targetStore) {
        targetStore = await prisma.store.create({
          data: {
            name: updatedStoreName.trim(),
            storeType: updatedStoreType,
            address: updatedAddress.trim(),
            latitude: input.lat ?? existingPromo.store.latitude,
            longitude: input.lng ?? existingPromo.store.longitude,
            createdByUserId: currentUser.id,
          },
        });
      }
      storeId = targetStore.id;
    }

    // 5. Update kategori jika diubah
    let categoryId = existingPromo.categoryId;
    if (input.category && input.category !== existingPromo.category.name) {
      let targetCat = await prisma.category.findFirst({
        where: { name: { equals: input.category.trim(), mode: "insensitive" } },
      });
      if (!targetCat) {
        const slug = input.category
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        targetCat = await prisma.category.upsert({
          where: { slug: slug || "lainnya" },
          update: { name: input.category.trim() },
          create: { name: input.category.trim(), slug: slug || "lainnya" },
        });
      }
      categoryId = targetCat.id;
    }

    // 6. Tangani endsAt jika tanggal atau jam diubah
    let endsAt = existingPromo.endsAt;
    if (input.expiryDate || input.expiryTime) {
      const baseDate = input.expiryDate || existingPromo.endsAt.toISOString().split("T")[0];
      const baseTime =
        input.expiryTime ||
        existingPromo.endsAt.toTimeString().split(" ")[0].slice(0, 5);
      const [year, month, day] = baseDate.split("-").map(Number);
      const [hour, minute] = baseTime.split(":").map(Number);
      endsAt = new Date(year, month - 1, day, hour, minute, 0, 0);
    }

    // 7. Lakukan update data promosi
    await prisma.promotion.update({
      where: { id },
      data: {
        storeId,
        categoryId,
        productName: input.title ?? existingPromo.productName,
        description: input.notes !== undefined ? input.notes : existingPromo.description,
        normalPrice: input.originalPrice ?? existingPromo.normalPrice,
        discountPrice: input.promoPrice ?? existingPromo.discountPrice,
        imageUrl: input.imageUrl ?? existingPromo.imageUrl,
        stockCondition: input.stockCondition
          ? mapFrontendToStockCondition(input.stockCondition)
          : existingPromo.stockCondition,
        endsAt,
        status: input.status ?? existingPromo.status,
      },
    });

    revalidatePath("/");

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error("[updatePromotionAction error]:", error);
    return {
      success: false,
      error: "Terjadi kesalahan pada server saat memperbarui promo.",
    };
  }
}

/**
 * Server Action: Menghapus promosi (Delete Promotion).
 * Hanya dapat dilakukan oleh pemilik/pembuat promosi tersebut.
 * Relasi ke validasi, log validasi, komentar, dan bookmark otomatis terhapus (Cascade).
 */
export async function deletePromotionAction(
  id: string
): Promise<PromoActionResult<{ id: string }>> {
  try {
    // 1. Verifikasi pengguna login
    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      return {
        success: false,
        error: "UNAUTHORIZED: Anda harus masuk terlebih dahulu.",
      };
    }

    // 2. Ambil data promosi dan verifikasi kepemilikan
    const promo = await prisma.promotion.findUnique({
      where: { id },
      select: { id: true, createdByUserId: true },
    });

    if (!promo) {
      return {
        success: false,
        error: "Promosi tidak ditemukan atau sudah dihapus.",
      };
    }

    if (promo.createdByUserId !== currentUser.id) {
      return {
        success: false,
        error: "FORBIDDEN: Anda hanya dapat menghapus promosi yang Anda unggah sendiri.",
      };
    }

    // 3. Hapus promosi dari database
    await prisma.promotion.delete({
      where: { id },
    });

    revalidatePath("/");

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error("[deletePromotionAction error]:", error);
    return {
      success: false,
      error: "Terjadi kesalahan pada server saat menghapus promosi.",
    };
  }
}
