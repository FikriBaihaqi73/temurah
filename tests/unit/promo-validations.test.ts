import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createPromotionSchema, mapFrontendToStoreType } from "../../src/features/promo/validations";
import { StoreType } from "../../src/generated/prisma/enums";

describe("Promotion Validations Unit Tests", () => {
  it("should validate a complete valid promo payload", () => {
    const payload = {
      title: "Minyak Goreng 2L Murah",
      category: "Kebutuhan Pokok",
      storeType: "Supermarket",
      storeName: "Superindo Kaliurang",
      address: "Jl. Kaliurang KM 5",
      originalPrice: 40000,
      promoPrice: 28000,
      expiryDate: "2026-12-31",
      imageUrl: "https://example.com/receipt.jpg",
      stockCondition: "Stok Masih Banyak",
    };

    const result = createPromotionSchema.safeParse(payload);
    assert.strictEqual(result.success, true);
  });

  it("should reject promoPrice higher than originalPrice", () => {
    const payload = {
      title: "Minyak Goreng 2L Murah",
      category: "Kebutuhan Pokok",
      storeType: "Supermarket",
      storeName: "Superindo Kaliurang",
      address: "Jl. Kaliurang KM 5",
      originalPrice: 30000,
      promoPrice: 35000, // Invalid: promoPrice > originalPrice
      expiryDate: "2026-12-31",
      imageUrl: "https://example.com/receipt.jpg",
    };

    const result = createPromotionSchema.safeParse(payload);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.path.includes("promoPrice")));
    }
  });

  it("should reject promo without required imageUrl", () => {
    const payload = {
      title: "Minyak Goreng 2L Murah",
      category: "Kebutuhan Pokok",
      storeType: "Supermarket",
      storeName: "Superindo Kaliurang",
      address: "Jl. Kaliurang KM 5",
      originalPrice: 40000,
      promoPrice: 28000,
      expiryDate: "2026-12-31",
      imageUrl: "",
    };

    const result = createPromotionSchema.safeParse(payload);
    assert.strictEqual(result.success, false);
  });

  describe("mapFrontendToStoreType", () => {
    it("should correctly map frontend store types to Prisma StoreType enum", () => {
      assert.strictEqual(mapFrontendToStoreType("Supermarket"), StoreType.SUPERMARKET);
      assert.strictEqual(mapFrontendToStoreType("Pasar Tradisional"), StoreType.TRADITIONAL_MARKET);
      assert.strictEqual(mapFrontendToStoreType("Minimarket"), StoreType.MINIMARKET);
      assert.strictEqual(mapFrontendToStoreType("Online / Marketplace"), StoreType.LOCAL_STORE);
    });
  });
});
