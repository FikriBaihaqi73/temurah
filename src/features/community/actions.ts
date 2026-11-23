"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAction, type SafeUser } from "@/features/auth/actions";
import {
  validatePromoSchema,
  bookmarkPromoSchema,
  addCommentSchema,
  deleteCommentSchema,
  type ValidatePromoInput,
  type BookmarkPromoInput,
  type AddCommentInput,
  type DeleteCommentInput,
} from "@/features/community/validations";
import { ValidationType, PromotionStatus } from "@/generated/prisma/enums";
import { preferenceToRoleAndBadge } from "@/features/auth/roles";
import { DEFAULT_AVATAR_PLACEHOLDER, getSafeAvatar } from "@/lib/avatar";
import type { PromoPost, PromoComment } from "@/lib/mock-data";
import {
  formatTimeAgo,
  transformPromotionToPromoPost,
  type PromotionWithRelations,
} from "@/features/promo/helpers";

export type CommunityActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export type ValidationToggleResult = {
  validCount: number;
  invalidCount: number;
  userVote: "valid" | "invalid" | null;
  status: PromotionStatus;
};

/**
 * Server Action: Memberi, mengganti, atau membatalkan validasi promosi (Promotion Validation).
 * Menyimpan ke PromotionValidation, mencatat ke PromotionValidationLog,
 * dan mengevaluasi konsensus komunitas secara transaksional.
 */
export async function toggleValidationAction(
  data: ValidatePromoInput,
  currentUserOverride?: SafeUser | null
): Promise<CommunityActionResult<ValidationToggleResult>> {
  try {
    // 1. Verifikasi pengguna masuk via session cookie
    const currentUser =
      process.env.NODE_ENV === "test" && currentUserOverride !== undefined
        ? currentUserOverride
        : await getCurrentUserAction();
    if (!currentUser) {
      return {
        success: false,
        error: "UNAUTHORIZED: Anda harus masuk terlebih dahulu untuk memvalidasi promo.",
      };
    }

    // 2. Validasi skema input
    const validation = validatePromoSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Input tidak valid.";
      return { success: false, error: firstError };
    }

    const { promotionId, validationType: inputType, note } = validation.data;

    // Petakan nilai frontend "INVALID" ke enum database "EXPIRED" sesuai spesifikasi sistem
    const targetType: ValidationType =
      inputType === "VALID" ? ValidationType.VALID : ValidationType.EXPIRED;

    // 3. Eksekusi mutasi, logging, dan konsensus di dalam Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Ambil data promosi terkait
      const promo = await tx.promotion.findUnique({
        where: { id: promotionId },
        select: {
          id: true,
          createdByUserId: true,
          status: true,
        },
      });

      if (!promo) {
        throw new Error("PROMOTION_NOT_FOUND");
      }

      // Periksa validasi aktif pengguna saat ini
      const existingValidation = await tx.promotionValidation.findUnique({
        where: {
          promotionId_userId: {
            promotionId: promo.id,
            userId: currentUser.id,
          },
        },
      });

      let finalUserVote: "valid" | "invalid" | null = null;

      if (existingValidation && existingValidation.validationType === targetType) {
        // Skenario A: Pembatalan validasi (Unvote - menekan pilihan yang sama kembali)
        await tx.promotionValidation.delete({
          where: { id: existingValidation.id },
        });

        // Catat pembatalan ke log validasi
        await tx.promotionValidationLog.create({
          data: {
            promotionId: promo.id,
            userId: currentUser.id,
            validationType: null,
            previousType: existingValidation.validationType,
            note: note?.trim() || null,
          },
        });

        finalUserVote = null;
      } else if (existingValidation) {
        // Skenario B: Mengganti jenis validasi sebelumnya (Switch vote)
        await tx.promotionValidation.update({
          where: { id: existingValidation.id },
          data: {
            validationType: targetType,
            note: note?.trim() || null,
          },
        });

        // Catat pergantian ke log validasi
        await tx.promotionValidationLog.create({
          data: {
            promotionId: promo.id,
            userId: currentUser.id,
            validationType: targetType,
            previousType: existingValidation.validationType,
            note: note?.trim() || null,
          },
        });

        finalUserVote = targetType === ValidationType.VALID ? "valid" : "invalid";
      } else {
        // Skenario C: Memberikan validasi baru pertama kali
        await tx.promotionValidation.create({
          data: {
            promotionId: promo.id,
            userId: currentUser.id,
            validationType: targetType,
            note: note?.trim() || null,
          },
        });

        // Catat pembuatan ke log validasi
        await tx.promotionValidationLog.create({
          data: {
            promotionId: promo.id,
            userId: currentUser.id,
            validationType: targetType,
            previousType: null,
            note: note?.trim() || null,
          },
        });

        finalUserVote = targetType === ValidationType.VALID ? "valid" : "invalid";
      }

      // 4. Hitung Konsensus Komunitas (Validasi dari pembuat promosi sendiri TIDAK dihitung dalam konsensus)
      const consensusValidCount = await tx.promotionValidation.count({
        where: {
          promotionId: promo.id,
          userId: { not: promo.createdByUserId },
          validationType: ValidationType.VALID,
        },
      });

      const consensusExpiredCount = await tx.promotionValidation.count({
        where: {
          promotionId: promo.id,
          userId: { not: promo.createdByUserId },
          validationType: { in: [ValidationType.INVALID, ValidationType.EXPIRED] },
        },
      });

      // 5. Evaluasi status promosi berdasarkan aturan konsensus
      let updatedStatus = promo.status;

      // Status ARCHIVED tidak diubah otomatis oleh validasi
      if (promo.status !== PromotionStatus.ARCHIVED) {
        if (consensusValidCount >= 3 && consensusValidCount > consensusExpiredCount) {
          // Minimal 3 pengguna berbeda memberikan VALID untuk mencapai status VERIFIED
          updatedStatus = PromotionStatus.VERIFIED;
        } else if (consensusExpiredCount >= 3 && consensusExpiredCount > consensusValidCount) {
          // Minimal 3 pengguna berbeda memberikan EXPIRED untuk memicu evaluasi status kedaluwarsa
          updatedStatus = PromotionStatus.EXPIRED;
        } else if (consensusValidCount === consensusExpiredCount) {
          // Jika jumlah VALID dan EXPIRED sama, jangan mengubah status secara otomatis
          updatedStatus = promo.status;
        } else {
          // Tidak mencapai batas minimal konsensus (misal setelah unvote menjadi < 3)
          if (promo.status === PromotionStatus.VERIFIED || promo.status === PromotionStatus.EXPIRED) {
            updatedStatus = PromotionStatus.ACTIVE;
          }
        }
      }

      if (updatedStatus !== promo.status) {
        await tx.promotion.update({
          where: { id: promo.id },
          data: { status: updatedStatus },
        });
      }

      // 6. Hitung total jumlah validasi terkini untuk tampilan antarmuka (termasuk suara pemilik)
      const totalValid = await tx.promotionValidation.count({
        where: {
          promotionId: promo.id,
          validationType: ValidationType.VALID,
        },
      });

      const totalExpired = await tx.promotionValidation.count({
        where: {
          promotionId: promo.id,
          validationType: { in: [ValidationType.INVALID, ValidationType.EXPIRED] },
        },
      });

      return {
        validCount: totalValid,
        invalidCount: totalExpired,
        userVote: finalUserVote,
        status: updatedStatus,
      };
    });

    try {
      revalidatePath("/");
    } catch {
      // Revalidation safe fallback for test execution
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "PROMOTION_NOT_FOUND") {
      return { success: false, error: "Promosi tidak ditemukan atau telah dihapus." };
    }
    console.error("[toggleValidationAction error]:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat memproses validasi promosi.",
    };
  }
}

/**
 * Server Action: Menambah atau menghapus Bookmark promosi (Toggle Bookmark).
 * Mencegah duplikasi dengan memanfaatkan constraint unik (userId, promotionId).
 */
export async function toggleBookmarkAction(
  data: BookmarkPromoInput,
  currentUserOverride?: SafeUser | null
): Promise<CommunityActionResult<{ isBookmarked: boolean }>> {
  try {
    // 1. Verifikasi pengguna masuk via session cookie
    const currentUser =
      process.env.NODE_ENV === "test" && currentUserOverride !== undefined
        ? currentUserOverride
        : await getCurrentUserAction();
    if (!currentUser) {
      return {
        success: false,
        error: "UNAUTHORIZED: Anda harus masuk terlebih dahulu untuk menyimpan bookmark.",
      };
    }

    // 2. Validasi input
    const validation = bookmarkPromoSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Input tidak valid.";
      return { success: false, error: firstError };
    }

    const { promotionId } = validation.data;

    // 3. Pastikan promosi yang akan dibookmark tersedia
    const promo = await prisma.promotion.findUnique({
      where: { id: promotionId },
      select: { id: true },
    });

    if (!promo) {
      return {
        success: false,
        error: "Promosi tidak ditemukan atau sudah dihapus.",
      };
    }

    // 4. Periksa apakah sudah dibookmark sebelumnya
    const existing = await prisma.userBookmark.findUnique({
      where: {
        userId_promotionId: {
          userId: currentUser.id,
          promotionId: promo.id,
        },
      },
    });

    let isBookmarked = false;
    if (existing) {
      // Hapus bookmark
      await prisma.userBookmark.delete({
        where: { id: existing.id },
      });
      isBookmarked = false;
    } else {
      // Buat bookmark baru
      await prisma.userBookmark.create({
        data: {
          userId: currentUser.id,
          promotionId: promo.id,
        },
      });
      isBookmarked = true;
    }

    try {
      revalidatePath("/");
    } catch {
      // Revalidation safe fallback for test execution
    }

    return {
      success: true,
      data: { isBookmarked },
    };
  } catch (error) {
    console.error("[toggleBookmarkAction error]:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat memperbarui bookmark promo.",
    };
  }
}

/**
 * Server Action: Mengambil daftar promosi yang telah dibookmark oleh pengguna aktif.
 */
export async function getUserBookmarksAction(
  currentUserOverride?: SafeUser | null
): Promise<
  CommunityActionResult<PromoPost[]>
> {
  try {
    const currentUser =
      process.env.NODE_ENV === "test" && currentUserOverride !== undefined
        ? currentUserOverride
        : await getCurrentUserAction();
    if (!currentUser) {
      return {
        success: false,
        error: "UNAUTHORIZED: Anda harus masuk terlebih dahulu.",
      };
    }

    const bookmarks = await prisma.userBookmark.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "desc" },
      include: {
        promotion: {
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
        },
      },
    });

    const mappedPromos: PromoPost[] = bookmarks.map((b) =>
      transformPromotionToPromoPost(b.promotion as unknown as PromotionWithRelations, currentUser.id)
    );

    return {
      success: true,
      data: mappedPromos,
    };
  } catch (error) {
    console.error("[getUserBookmarksAction error]:", error);
    return {
      success: false,
      error: "Gagal memuat daftar bookmark pengguna.",
    };
  }
}

/**
 * Server Action: Menambahkan komentar atau laporan stok pada promosi.
 */
export async function addCommentAction(
  data: AddCommentInput,
  currentUserOverride?: SafeUser | null
): Promise<CommunityActionResult<PromoComment>> {
  try {
    const currentUser =
      process.env.NODE_ENV === "test" && currentUserOverride !== undefined
        ? currentUserOverride
        : await getCurrentUserAction();
    if (!currentUser) {
      return {
        success: false,
        error: "UNAUTHORIZED: Anda harus masuk terlebih dahulu untuk menulis komentar.",
      };
    }

    const validation = addCommentSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Input komentar tidak valid.";
      return { success: false, error: firstError };
    }

    const { promotionId, content } = validation.data;

    // Pastikan promosi tersedia
    const promo = await prisma.promotion.findUnique({
      where: { id: promotionId },
      select: { id: true },
    });

    if (!promo) {
      return {
        success: false,
        error: "Promosi tidak ditemukan atau telah dihapus.",
      };
    }

    // Simpan komentar ke database
    const newComment = await prisma.comment.create({
      data: {
        promotionId: promo.id,
        userId: currentUser.id,
        content: content.trim(),
      },
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
    });

    const { badge } = preferenceToRoleAndBadge(newComment.user.preference);

    const formattedComment: PromoComment = {
      id: newComment.id,
      userName: newComment.user.name,
      userAvatar: getSafeAvatar(newComment.user.avatarUrl),
      badge,
      content: newComment.content,
      timeAgo: "Baru saja",
      isVerifiedBuyer: true,
    };

    try {
      revalidatePath("/");
    } catch {
      // Revalidation safe fallback for test execution
    }

    return {
      success: true,
      data: formattedComment,
    };
  } catch (error) {
    console.error("[addCommentAction error]:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat menambahkan komentar.",
    };
  }
}

/**
 * Server Action: Mengambil seluruh komentar untuk sebuah promosi (Read Comments).
 */
export async function getCommentsAction(
  promotionId: string
): Promise<CommunityActionResult<PromoComment[]>> {
  try {
    if (!promotionId) {
      return { success: false, error: "ID promosi wajib diisi." };
    }

    const comments = await prisma.comment.findMany({
      where: { promotionId },
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
    });

    const mappedComments: PromoComment[] = comments.map((c) => {
      const { badge } = preferenceToRoleAndBadge(c.user.preference);
      return {
        id: c.id,
        userName: c.user.name,
        userAvatar: getSafeAvatar(c.user.avatarUrl),
        badge,
        content: c.content,
        timeAgo: formatTimeAgo(c.createdAt),
        isVerifiedBuyer: true,
      };
    });

    return {
      success: true,
      data: mappedComments,
    };
  } catch (error) {
    console.error("[getCommentsAction error]:", error);
    return {
      success: false,
      error: "Gagal memuat komentar promosi.",
    };
  }
}

/**
 * Server Action: Menghapus komentar milik pengguna aktif (Delete Comment).
 * Hanya pembuat komentar yang dapat menghapus komentar miliknya.
 */
export async function deleteCommentAction(
  data: DeleteCommentInput,
  currentUserOverride?: SafeUser | null
): Promise<CommunityActionResult<{ id: string }>> {
  try {
    const currentUser =
      process.env.NODE_ENV === "test" && currentUserOverride !== undefined
        ? currentUserOverride
        : await getCurrentUserAction();
    if (!currentUser) {
      return {
        success: false,
        error: "UNAUTHORIZED: Anda harus masuk terlebih dahulu.",
      };
    }

    const validation = deleteCommentSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Input tidak valid.";
      return { success: false, error: firstError };
    }

    const { commentId } = validation.data;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        userId: true,
        promotionId: true,
      },
    });

    if (!comment) {
      return {
        success: false,
        error: "Komentar tidak ditemukan atau telah dihapus.",
      };
    }

    // Pastikan hanya pembuat komentar yang dapat menghapus
    if (comment.userId !== currentUser.id) {
      return {
        success: false,
        error: "FORBIDDEN: Anda hanya dapat menghapus komentar Anda sendiri.",
      };
    }

    await prisma.comment.delete({
      where: { id: comment.id },
    });

    try {
      revalidatePath("/");
    } catch {
      // Revalidation safe fallback for test execution
    }

    return {
      success: true,
      data: { id: comment.id },
    };
  } catch (error) {
    console.error("[deleteCommentAction error]:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat menghapus komentar.",
    };
  }
}
