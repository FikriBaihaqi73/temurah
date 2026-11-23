import type { PromoPost, PromoComment } from "@/lib/mock-data";
import { preferenceToRoleAndBadge } from "@/features/auth/roles";
import { mapStoreTypeToFrontend } from "@/features/promo/validations";
import { StoreType, UserPreference } from "@/generated/prisma/enums";
import { DEFAULT_AVATAR_PLACEHOLDER, getSafeAvatar } from "@/lib/avatar";

// Pusat koordinat standar area Yogyakarta / Sleman untuk hitung jarak
export const DEFAULT_USER_LAT = -7.7829;
export const DEFAULT_USER_LNG = 110.3671;

/**
 * Helper: Bangun query kondisi wilayah (Area) terhadap kolom alamat toko.
 * Menghindari false positive pada penulisan alamat DIY (misal: Sleman, D.I. Yogyakarta).
 */
export function buildAreaWhereClause(area?: string): Record<string, unknown> | null {
  if (!area || area === "all" || area === "Semua Area" || area === "All Areas") {
    return null;
  }

  const normalized = area.trim().toLowerCase();

  if (normalized.includes("sleman")) {
    return {
      address: {
        contains: "Sleman",
        mode: "insensitive",
      },
    };
  }

  if (normalized.includes("bantul")) {
    return {
      address: {
        contains: "Bantul",
        mode: "insensitive",
      },
    };
  }

  if (
    normalized.includes("kota") ||
    normalized.includes("yogyakarta") ||
    normalized.includes("jogja")
  ) {
    // Kota Yogyakarta: Mencocokkan toko di Kota Yogyakarta tanpa keliru mencakup Sleman/Bantul/Kulon Progo
    return {
      AND: [
        {
          OR: [
            { address: { contains: "Kota", mode: "insensitive" } },
            { address: { contains: "Yogyakarta", mode: "insensitive" } },
            { address: { contains: "Jogja", mode: "insensitive" } },
          ],
        },
        { NOT: { address: { contains: "Sleman", mode: "insensitive" } } },
        { NOT: { address: { contains: "Bantul", mode: "insensitive" } } },
        { NOT: { address: { contains: "Kulon Progo", mode: "insensitive" } } },
        { NOT: { address: { contains: "Gunungkidul", mode: "insensitive" } } },
      ],
    };
  }

  // Fallback pencarian fleksibel
  return {
    address: {
      contains: area.trim(),
      mode: "insensitive",
    },
  };
}

/**
 * Helper: Hitung jarak Haversine antara dua koordinat geolokasi.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): string {
  const d = calculateDistanceKm(lat1, lon1, lat2, lon2);
  if (d < 1) {
    return `${Math.round(d * 1000)} m`;
  }
  return `${d.toFixed(1)} km`;
}

/**
 * Helper: Hitung jarak numerik murni dalam kilometer (KM).
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
  return R * c;
}

/**
 * Helper: Format sisa masa berlaku promo ramah pengguna.
 */
export function formatValidUntil(endsAt: Date): string {
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
export function formatTimeAgo(date: Date): string {
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

export type PromotionWithRelations = {
  id: string;
  productName: string;
  description: string | null;
  normalPrice: number;
  discountPrice: number;
  imageUrl: string;
  endsAt: Date;
  store: {
    name: string;
    storeType: StoreType;
    address: string;
    latitude: number;
    longitude: number;
  };
  category: {
    name: string;
  };
  createdByUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
    preference: UserPreference;
  };
  validations?: Array<{
    userId?: string;
    validationType: string;
  }>;
  bookmarks?: Array<{
    userId?: string;
  }>;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      avatarUrl: string | null;
      preference: UserPreference;
    };
  }>;
  _count?: {
    comments?: number;
  };
};

/**
 * Helper transformasi Model Database Promotion ke Format Frontend PromoPost.
 */
export function transformPromotionToPromoPost(
  promo: PromotionWithRelations,
  currentUserId?: string | null,
  userCoordinates?: { lat: number; lng: number }
): PromoPost {
  const origPrice = promo.normalPrice;
  const promoPrice = promo.discountPrice;
  const discountPercentage =
    origPrice > promoPrice && origPrice > 0
      ? Math.round(((origPrice - promoPrice) / origPrice) * 100)
      : 0;

  const defaultAvatar = DEFAULT_AVATAR_PLACEHOLDER;

  const { badge: contributorBadge } = preferenceToRoleAndBadge(
    promo.createdByUser.preference
  );

  const confirmedCount = (promo.validations || []).filter(
    (v) => v.validationType === "VALID"
  ).length;
  const expiredReportsCount = (promo.validations || []).filter(
    (v) => v.validationType === "INVALID" || v.validationType === "EXPIRED"
  ).length;

  let userVote: "valid" | "invalid" | null = null;
  if (currentUserId && promo.validations) {
    const userVal = promo.validations.find((v) => v.userId === currentUserId);
    if (userVal) {
      userVote = userVal.validationType === "VALID" ? "valid" : "invalid";
    }
  }

  let isBookmarked = false;
  if (currentUserId && promo.bookmarks) {
    isBookmarked = promo.bookmarks.some((b) => b.userId === currentUserId);
  }

  const comments: PromoComment[] = (promo.comments || []).map((c) => {
    const { badge: commentBadge } = preferenceToRoleAndBadge(c.user.preference);
    return {
      id: c.id,
      userName: c.user.name,
      userAvatar: getSafeAvatar(c.user.avatarUrl),
      badge: commentBadge,
      content: c.content,
      timeAgo: formatTimeAgo(c.createdAt),
      isVerifiedBuyer: true,
    };
  });

  const userLat = userCoordinates?.lat ?? DEFAULT_USER_LAT;
  const userLng = userCoordinates?.lng ?? DEFAULT_USER_LNG;

  const distance = calculateDistance(
    userLat,
    userLng,
    promo.store.latitude,
    promo.store.longitude
  );

  return {
    id: promo.id,
    title: promo.productName,
    category: promo.category.name,
    storeName: promo.store.name,
    storeType: mapStoreTypeToFrontend(promo.store.storeType, promo.store.address),
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
      avatar: getSafeAvatar(promo.createdByUser.avatarUrl),
      badge: contributorBadge,
    },
    confirmedCount,
    expiredReportsCount,
    commentsCount: promo._count?.comments ?? comments.length,
    comments,
    isHot: confirmedCount >= 10 || discountPercentage >= 25,
    userVote,
    isBookmarked,
  };
}
