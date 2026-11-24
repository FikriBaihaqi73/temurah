import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validatePromoSchema,
  bookmarkPromoSchema,
  addCommentSchema,
  deleteCommentSchema,
} from "../../src/features/community/validations";

describe("Community Validations Unit Tests", () => {
  describe("validatePromoSchema", () => {
    it("should accept valid promo validation input", () => {
      const validData = {
        promotionId: "123e4567-e89b-12d3-a456-426614174000",
        validationType: "VALID",
        note: "Stok masih melimpah",
      };
      const result = validatePromoSchema.safeParse(validData);
      assert.strictEqual(result.success, true);
    });

    it("should reject non-uuid promotionId", () => {
      const invalidData = {
        promotionId: "not-a-uuid",
        validationType: "VALID",
      };
      const result = validatePromoSchema.safeParse(invalidData);
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.path.includes("promotionId")));
      }
    });

    it("should reject invalid validation type", () => {
      const invalidData = {
        promotionId: "123e4567-e89b-12d3-a456-426614174000",
        validationType: "NOT_VALID_TYPE",
      };
      const result = validatePromoSchema.safeParse(invalidData);
      assert.strictEqual(result.success, false);
    });
  });

  describe("bookmarkPromoSchema", () => {
    it("should validate promotionId as uuid", () => {
      const valid = bookmarkPromoSchema.safeParse({
        promotionId: "123e4567-e89b-12d3-a456-426614174000",
      });
      assert.strictEqual(valid.success, true);

      const invalid = bookmarkPromoSchema.safeParse({
        promotionId: "invalid-id",
      });
      assert.strictEqual(invalid.success, false);
    });
  });

  describe("addCommentSchema", () => {
    it("should accept comment with valid content", () => {
      const result = addCommentSchema.safeParse({
        promotionId: "123e4567-e89b-12d3-a456-426614174000",
        content: "Promo ini sangat membantu, terima kasih!",
      });
      assert.strictEqual(result.success, true);
    });

    it("should reject empty comment content", () => {
      const result = addCommentSchema.safeParse({
        promotionId: "123e4567-e89b-12d3-a456-426614174000",
        content: "   ",
      });
      assert.strictEqual(result.success, false);
    });

    it("should reject comment exceeding max length (1000 chars)", () => {
      const longComment = "a".repeat(1001);
      const result = addCommentSchema.safeParse({
        promotionId: "123e4567-e89b-12d3-a456-426614174000",
        content: longComment,
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe("deleteCommentSchema", () => {
    it("should accept valid uuid commentId", () => {
      const result = deleteCommentSchema.safeParse({
        commentId: "123e4567-e89b-12d3-a456-426614174000",
      });
      assert.strictEqual(result.success, true);
    });
  });
});
