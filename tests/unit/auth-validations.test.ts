import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../../src/features/auth/validations";
import {
  preferenceToRoleAndBadge,
  roleToPreference,
} from "../../src/features/auth/roles";
import { UserPreference } from "../../src/generated/prisma/enums";

describe("Auth Validations & Roles Unit Tests", () => {
  describe("registerSchema", () => {
    it("should accept valid registration data", () => {
      const data = {
        name: "Budi Santoso",
        email: "budi@example.com",
        password: "password123",
        confirmPassword: "password123",
        role: "Mahasiswa",
      };
      const result = registerSchema.safeParse(data);
      assert.strictEqual(result.success, true);
    });

    it("should reject password mismatch", () => {
      const data = {
        name: "Budi Santoso",
        email: "budi@example.com",
        password: "password123",
        confirmPassword: "password456",
        role: "Mahasiswa",
      };
      const result = registerSchema.safeParse(data);
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.path.includes("confirmPassword")));
      }
    });

    it("should reject invalid email format", () => {
      const data = {
        name: "Budi Santoso",
        email: "budi-bukan-email",
        password: "password123",
        confirmPassword: "password123",
        role: "Mahasiswa",
      };
      const result = registerSchema.safeParse(data);
      assert.strictEqual(result.success, false);
    });

    it("should reject short password (< 6 chars)", () => {
      const data = {
        name: "Budi Santoso",
        email: "budi@example.com",
        password: "123",
        confirmPassword: "123",
        role: "Mahasiswa",
      };
      const result = registerSchema.safeParse(data);
      assert.strictEqual(result.success, false);
    });
  });

  describe("loginSchema", () => {
    it("should accept valid email and password", () => {
      const result = loginSchema.safeParse({
        email: "admin@temurah.id",
        password: "adminpassword",
      });
      assert.strictEqual(result.success, true);
    });

    it("should reject missing password", () => {
      const result = loginSchema.safeParse({
        email: "admin@temurah.id",
        password: "",
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe("updateProfileSchema", () => {
    it("should accept valid profile updates", () => {
      const result = updateProfileSchema.safeParse({
        name: "Budi Santoso Baru",
        role: "Pekerja / Karyawan",
      });
      assert.strictEqual(result.success, true);
    });

    it("should reject short new password if provided", () => {
      const result = updateProfileSchema.safeParse({
        name: "Budi Santoso Baru",
        role: "Pekerja / Karyawan",
        currentPassword: "oldpassword123",
        newPassword: "123",
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe("role & preference mapping", () => {
    it("should map UserPreference enum to role name and badge correctly", () => {
      const student = preferenceToRoleAndBadge(UserPreference.STUDENT);
      assert.strictEqual(student.role, "Mahasiswa");
      assert.ok(student.badge.includes("🎓"));

      const housewife = preferenceToRoleAndBadge(UserPreference.HOUSEWIFE);
      assert.strictEqual(housewife.role, "Ibu Rumah Tangga");
      assert.ok(housewife.badge.includes("🏠"));
    });

    it("should map role string to UserPreference enum correctly", () => {
      assert.strictEqual(roleToPreference("Mahasiswa"), UserPreference.STUDENT);
      assert.strictEqual(roleToPreference("Pekerja / Karyawan"), UserPreference.WORKER);
      assert.strictEqual(roleToPreference("Ibu Rumah Tangga"), UserPreference.HOUSEWIFE);
      assert.strictEqual(roleToPreference("Pemilik UMKM / Usaha"), UserPreference.MSME_OWNER);
      assert.strictEqual(roleToPreference("Pencari Diskon Umum"), UserPreference.GENERAL);
    });
  });
});
