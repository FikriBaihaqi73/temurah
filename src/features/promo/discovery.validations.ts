import { z } from "zod";

export const discoveryFilterSchema = z.object({
  searchQuery: z
    .string()
    .trim()
    .max(100, "Kata kunci pencarian maksimal 100 karakter.")
    .optional()
    .default(""),
  category: z.string().trim().optional(),
  storeType: z.string().trim().optional(),
  area: z.string().trim().optional(),
  userLat: z.coerce.number().optional(),
  userLng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().nonnegative().max(50000).default(10).optional(),
  sortBy: z
    .enum(["newest", "most_validated", "biggest_discount"], {
      message: "Kriteria pengurutan harus salah satu dari: newest, most_validated, biggest_discount.",
    })
    .default("newest")
    .optional(),
  page: z.coerce.number().int().positive("Halaman harus bilangan positif.").default(1).optional(),
  limit: z.coerce.number().int().positive().max(100, "Batas data per halaman maksimal 100.").default(20).optional(),
});

export type DiscoveryFilterInput = z.input<typeof discoveryFilterSchema>;
export type DiscoveryFilterOutput = z.infer<typeof discoveryFilterSchema>;

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
};

export type DiscoverPromotionsResult = {
  promotions: import("@/lib/mock-data").PromoPost[];
  pagination: PaginationMeta;
};
