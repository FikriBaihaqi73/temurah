import { z } from "zod";
import { StoreType, StockCondition, PromotionStatus } from "@/generated/prisma/enums";

export const FRONTEND_STORE_TYPES = [
  "Supermarket",
  "Pasar Tradisional",
  "Minimarket",
  "Toko Lokal",
  "Toko Lokal / Kelontong",
  "Toko Buah & Sayur",
  "Online / Marketplace",
] as const;

export const FRONTEND_STOCK_CONDITIONS = [
  "Stok Banyak",
  "Stok Masih Banyak",
  "Stok Terbatas",
  "Sisa Sedikit",
] as const;

export const createPromotionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Nama produk promo minimal 3 karakter.")
      .max(200, "Nama produk promo maksimal 200 karakter."),
    category: z.string().trim().min(1, "Kategori produk wajib dipilih."),
    storeType: z.string().trim().min(1, "Tipe toko wajib dipilih."),
    storeName: z
      .string()
      .trim()
      .min(2, "Nama toko atau pasar wajib diisi.")
      .max(150, "Nama toko maksimal 150 karakter."),
    address: z
      .string()
      .trim()
      .min(3, "Alamat atau patokan jalan minimal 3 karakter."),
    lat: z.number().min(-90).max(90).default(-7.7829),
    lng: z.number().min(-180).max(180).default(110.3671),
    originalPrice: z
      .number()
      .int("Harga normal harus berupa bilangan bulat.")
      .nonnegative("Harga normal tidak boleh negatif.")
      .default(0),
    promoPrice: z
      .number()
      .int("Harga promo harus berupa bilangan bulat.")
      .positive("Harga promo harus lebih dari Rp 0."),
    expiryDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal kedaluwarsa harus YYYY-MM-DD."),
    expiryTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Format jam kedaluwarsa harus HH:mm.")
      .default("23:59"),
    stockCondition: z.string().default("Stok Banyak"),
    notes: z.string().max(1000, "Catatan maksimal 1000 karakter.").optional().default(""),
    imageUrl: z.string().min(1, "Wajib menyertakan bukti foto label promo atau struk."),
  })
  .refine(
    (data) => {
      if (data.originalPrice > 0) {
        return data.promoPrice < data.originalPrice;
      }
      return true;
    },
    {
      message: "Harga promo nyata harus lebih murah daripada harga normal coret.",
      path: ["promoPrice"],
    }
  );

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;

export const updatePromotionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Nama produk promo minimal 3 karakter.")
      .max(200, "Nama produk promo maksimal 200 karakter.")
      .optional(),
    category: z.string().trim().min(1).optional(),
    storeType: z.string().trim().min(1).optional(),
    storeName: z.string().trim().min(2).max(150).optional(),
    address: z.string().trim().min(3).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    originalPrice: z.number().int().nonnegative().optional(),
    promoPrice: z.number().int().positive().optional(),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    expiryTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    stockCondition: z.string().optional(),
    notes: z.string().max(1000).optional(),
    imageUrl: z.string().min(1).optional(),
    status: z.nativeEnum(PromotionStatus).optional(),
  })
  .refine(
    (data) => {
      if (
        data.originalPrice !== undefined &&
        data.promoPrice !== undefined &&
        data.originalPrice > 0
      ) {
        return data.promoPrice < data.originalPrice;
      }
      return true;
    },
    {
      message: "Harga promo nyata harus lebih murah daripada harga normal coret.",
      path: ["promoPrice"],
    }
  );

export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;

// Helper mapping: Frontend store type string -> Database StoreType enum
export function mapFrontendToStoreType(frontendType: string): StoreType {
  switch (frontendType) {
    case "Supermarket":
    case "SUPERMARKET":
      return StoreType.SUPERMARKET;
    case "Pasar Tradisional":
    case "TRADITIONAL_MARKET":
      return StoreType.TRADITIONAL_MARKET;
    case "Minimarket":
    case "MINIMARKET":
      return StoreType.MINIMARKET;
    case "Toko Buah & Sayur":
    case "FRUIT_VEGETABLE_STORE":
      return StoreType.FRUIT_VEGETABLE_STORE;
    case "Toko Lokal":
    case "Toko Lokal / Kelontong":
    case "LOCAL_STORE":
    case "Online / Marketplace":
    default:
      return StoreType.LOCAL_STORE;
  }
}

// Helper mapping: Database StoreType enum -> Frontend store type string
export function mapStoreTypeToFrontend(
  storeType: StoreType
): "Supermarket" | "Pasar Tradisional" | "Minimarket" | "Online / Marketplace" | "Toko Lokal" {
  switch (storeType) {
    case StoreType.SUPERMARKET:
      return "Supermarket";
    case StoreType.TRADITIONAL_MARKET:
      return "Pasar Tradisional";
    case StoreType.MINIMARKET:
      return "Minimarket";
    case StoreType.FRUIT_VEGETABLE_STORE:
      return "Toko Lokal";
    case StoreType.LOCAL_STORE:
    default:
      return "Toko Lokal";
  }
}

// Helper mapping: Frontend stock condition string -> Database StockCondition enum
export function mapFrontendToStockCondition(frontendCond: string): StockCondition {
  switch (frontendCond) {
    case "Stok Terbatas":
      return StockCondition.LIMITED;
    case "Sisa Sedikit":
      return StockCondition.LOW;
    case "Stok Banyak":
    case "Stok Masih Banyak":
    default:
      return StockCondition.PLENTY;
  }
}

// Helper mapping: Database StockCondition enum -> Frontend stock condition string
export function mapStockConditionToFrontend(cond: StockCondition): string {
  switch (cond) {
    case StockCondition.LIMITED:
      return "Stok Terbatas";
    case StockCondition.LOW:
      return "Sisa Sedikit";
    case StockCondition.PLENTY:
    default:
      return "Stok Banyak";
  }
}
