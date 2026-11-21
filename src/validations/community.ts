import { z } from "zod";

export const validatePromoSchema = z.object({
  promotionId: z.string().uuid("ID promosi tidak valid."),
  validationType: z.enum(["VALID", "INVALID", "EXPIRED"], {
    message: "Tipe validasi harus VALID, INVALID, atau EXPIRED.",
  }),
  note: z.string().max(255, "Catatan maksimal 255 karakter.").optional(),
});

export type ValidatePromoInput = z.infer<typeof validatePromoSchema>;

export const bookmarkPromoSchema = z.object({
  promotionId: z.string().uuid("ID promosi tidak valid."),
});

export type BookmarkPromoInput = z.infer<typeof bookmarkPromoSchema>;

export const addCommentSchema = z.object({
  promotionId: z.string().uuid("ID promosi tidak valid."),
  content: z
    .string()
    .trim()
    .min(1, "Isi komentar tidak boleh kosong.")
    .max(1000, "Isi komentar maksimal 1000 karakter."),
});

export type AddCommentInput = z.infer<typeof addCommentSchema>;

export const deleteCommentSchema = z.object({
  commentId: z.string().uuid("ID komentar tidak valid."),
});

export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
