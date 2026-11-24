import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatRupiah, cn } from "../../src/lib/utils";

describe("Utils & Formatters Unit Tests", () => {
  describe("formatRupiah", () => {
    it("should format number into Indonesian Rupiah format", () => {
      // Intl format includes non-breaking space (\u00a0) between 'Rp' and number
      assert.strictEqual(formatRupiah(10000).replace(/\u00a0/g, " "), "Rp 10.000");
      assert.strictEqual(formatRupiah(1500000).replace(/\u00a0/g, " "), "Rp 1.500.000");
      assert.strictEqual(formatRupiah(0).replace(/\u00a0/g, " "), "Rp 0");
    });

    it("should handle floating points properly", () => {
      assert.strictEqual(formatRupiah(12500.5).replace(/\u00a0/g, " "), "Rp 12.501");
    });
  });

  describe("cn (tailwind merge + clsx)", () => {
    it("should merge classes and handle conditionals correctly", () => {
      const result = cn("text-sm", true && "font-bold", false && "hidden");
      assert.strictEqual(result, "text-sm font-bold");
    });

    it("should override conflicting tailwind utility classes", () => {
      const result = cn("p-4", "p-2");
      assert.strictEqual(result, "p-2");
    });
  });
});
