"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserAction, type SafeUser } from "@/actions/auth";
import { PromotionStatus, StoreType } from "@/generated/prisma/enums";
import { mapFrontendToStoreType } from "@/validations/promo";
import {
  transformPromotionToPromoPost,
  buildAreaWhereClause,
  type PromotionWithRelations,
} from "@/lib/promo-helpers";
import {
  discoveryFilterSchema,
  type DiscoveryFilterInput,
  type DiscoverPromotionsResult,
  type PaginationMeta,
} from "@/validations/discovery";
import type { PromoActionResult } from "@/actions/promo";

/**
 * Server Action: Discovery & Filtering Promosi
 * Mendukung pencarian kata kunci, filter kategori, jenis toko, wilayah, pengurutan, dan pagination.
 */
export async function getDiscoverPromotionsAction(
  filters?: DiscoveryFilterInput,
  currentUserOverride?: SafeUser | null
): Promise<PromoActionResult<DiscoverPromotionsResult>> {
  try {
    // 1. Validasi input filter menggunakan Zod
    const validation = discoveryFilterSchema.safeParse(filters || {});
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Parameter filter tidak valid.";
      return { success: false, error: firstError };
    }

    const input = validation.data;
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const sortBy = input.sortBy ?? "newest";

    // 2. Dapatkan identitas user aktif (jika ada) untuk personalisasi bookmark & vote
    const currentUser =
      currentUserOverride !== undefined
        ? currentUserOverride
        : process.env.NODE_ENV === "test"
        ? null
        : await getCurrentUserAction().catch(() => null);

    // 3. Bangun Prisma Where Clause secara dinamis
    const whereClause: Record<string, unknown> = {
      status: { in: [PromotionStatus.ACTIVE, PromotionStatus.VERIFIED] },
    };

    // Filter Kategori
    if (
      input.category &&
      input.category !== "all" &&
      input.category !== "Semua Kategori"
    ) {
      const catTrimmed = input.category.trim();
      whereClause.category = {
        OR: [
          { name: { equals: catTrimmed, mode: "insensitive" } },
          { slug: { equals: catTrimmed.toLowerCase(), mode: "insensitive" } },
        ],
      };
    }

    // Filter Tipe Toko & Filter Wilayah (Keduanya mengacu pada relasi Store)
    const storeWhereConditions: Record<string, unknown> = {};

    if (
      input.storeType &&
      input.storeType !== "all" &&
      input.storeType !== "Semua Toko"
    ) {
      const storeTypeEnum: StoreType = mapFrontendToStoreType(input.storeType);
      storeWhereConditions.storeType = storeTypeEnum;
    }

    const areaWhere = buildAreaWhereClause(input.area);
    if (areaWhere) {
      Object.assign(storeWhereConditions, areaWhere);
    }

    if (Object.keys(storeWhereConditions).length > 0) {
      whereClause.store = storeWhereConditions;
    }

    // Filter Pencarian Kata Kunci (Search Query)
    if (input.searchQuery && input.searchQuery.trim()) {
      const q = input.searchQuery.trim();
      const tokens = q.split(/\s+/).filter(Boolean);

      if (tokens.length === 1) {
        whereClause.OR = [
          { productName: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { store: { name: { contains: q, mode: "insensitive" } } },
          { store: { address: { contains: q, mode: "insensitive" } } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ];
      } else {
        // Multi-kata kunci: setiap kata harus cocok pada salah satu field
        whereClause.AND = tokens.map((token) => ({
          OR: [
            { productName: { contains: token, mode: "insensitive" } },
            { description: { contains: token, mode: "insensitive" } },
            { store: { name: { contains: token, mode: "insensitive" } } },
            { store: { address: { contains: token, mode: "insensitive" } } },
            { category: { name: { contains: token, mode: "insensitive" } } },
          ],
        }));
      }
    }

    // 4. Hitung total data yang cocok untuk pagination metadata
    const total = await prisma.promotion.count({
      where: whereClause,
    });

    // 5. Query data promosi beserta seluruh relasi terkait
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
            userId: true,
            validationType: true,
          },
        },
        bookmarks: {
          select: {
            userId: true,
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
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    // 6. Transformasi ke format PromoPost
    const mappedPromos = promotions.map((promo) =>
      transformPromotionToPromoPost(
        promo as unknown as PromotionWithRelations,
        currentUser?.id
      )
    );

    // 7. Pengurutan (Sorting) sesuai kriteria yang diminta
    if (sortBy === "most_validated") {
      mappedPromos.sort((a, b) => {
        if (b.confirmedCount !== a.confirmedCount) {
          return b.confirmedCount - a.confirmedCount;
        }
        return b.id.localeCompare(a.id);
      });
    } else if (sortBy === "biggest_discount") {
      mappedPromos.sort((a, b) => {
        if (b.discountPercentage !== a.discountPercentage) {
          return b.discountPercentage - a.discountPercentage;
        }
        return b.id.localeCompare(a.id);
      });
    }
    // Jika "newest", sudah terurut createdAt: "desc", id: "desc" dari database

    // 8. Pagination Sederhana
    const totalPages = Math.ceil(total / limit) || 1;
    const hasMore = page < totalPages;
    const startIndex = (page - 1) * limit;
    const paginatedPromos = mappedPromos.slice(startIndex, startIndex + limit);

    const paginationMeta: PaginationMeta = {
      total,
      page,
      limit,
      totalPages,
      hasMore,
    };

    return {
      success: true,
      data: {
        promotions: paginatedPromos,
        pagination: paginationMeta,
      },
    };
  } catch (error) {
    console.error("[getDiscoverPromotionsAction error]:", error);
    return {
      success: false,
      error: "Gagal memuat katalog promosi berdasarkan filter yang dipilih.",
    };
  }
}
