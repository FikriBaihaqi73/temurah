"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
  type UserRole,
} from "@/validations/auth";
import {
  setSessionCookie,
  deleteSessionCookie,
  getSession,
  roleToPreference,
  preferenceToRoleAndBadge,
  type SessionPayload,
} from "@/lib/auth-session";

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badge: string;
  avatar: string;
};

export type AuthActionResult =
  | { success: true; user: SafeUser }
  | { success: false; error: string };

/**
 * Server Action: Mendaftarkan akun baru warga.
 */
export async function registerAction(
  data: RegisterInput
): Promise<AuthActionResult> {
  try {
    // 1. Validasi Zod
    const validation = registerSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Input tidak valid.";
      return { success: false, error: firstError };
    }

    const { name, email, password, role } = validation.data;

    // 2. Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Email sudah terdaftar. Silakan gunakan email lain atau langsung masuk.",
      };
    }

    // 3. Hash Password dengan bcrypt
    const passwordHash = await bcrypt.hash(password, 10);
    const preference = roleToPreference(role);
    const { badge } = preferenceToRoleAndBadge(preference);

    // Default Avatar netral berdasarkan persona
    const defaultAvatar =
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80";

    // 4. Simpan ke database via Prisma
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        preference,
        avatarUrl: defaultAvatar,
      },
    });

    // 5. Buat dan simpan secure HttpOnly session cookie
    const sessionPayload: SessionPayload = {
      sub: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role,
      badge,
      avatarUrl: newUser.avatarUrl,
      preference: newUser.preference,
    };

    await setSessionCookie(sessionPayload);

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role,
        badge,
        avatar: newUser.avatarUrl || defaultAvatar,
      },
    };
  } catch (error) {
    console.error("[registerAction error]:", error);
    return {
      success: false,
      error: "Terjadi kendala pada server saat mendaftarkan akun. Silakan coba lagi.",
    };
  }
}

/**
 * Server Action: Masuk ke akun warga (Login).
 */
export async function loginAction(
  data: LoginInput
): Promise<AuthActionResult> {
  try {
    // 1. Validasi Zod
    const validation = loginSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Input tidak valid.";
      return { success: false, error: firstError };
    }

    const { email, password } = validation.data;

    // 2. Cari user di database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.deletedAt) {
      return {
        success: false,
        error: "Email atau kata sandi tidak sesuai.",
      };
    }

    // 3. Verifikasi hash password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        success: false,
        error: "Email atau kata sandi tidak sesuai.",
      };
    }

    // 4. Transform persona ke role & badge
    const { role, badge } = preferenceToRoleAndBadge(user.preference);
    const avatar =
      user.avatarUrl ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80";

    // 5. Buat dan simpan session cookie
    const sessionPayload: SessionPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role,
      badge,
      avatarUrl: user.avatarUrl,
      preference: user.preference,
    };

    await setSessionCookie(sessionPayload);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        badge,
        avatar,
      },
    };
  } catch (error) {
    console.error("[loginAction error]:", error);
    return {
      success: false,
      error: "Terjadi kendala pada server saat proses masuk. Silakan coba lagi.",
    };
  }
}

/**
 * Server Action: Mengambil data pengguna aktif saat ini (Current User).
 */
export async function getCurrentUserAction(): Promise<SafeUser | null> {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return null;
    }

    // Verifikasi ke database apakah user masih ada dan aktif
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        name: true,
        email: true,
        preference: true,
        avatarUrl: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      await deleteSessionCookie();
      return null;
    }

    const { role, badge } = preferenceToRoleAndBadge(user.preference);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      badge,
      avatar:
        user.avatarUrl ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    };
  } catch (error) {
    console.error("[getCurrentUserAction error]:", error);
    return null;
  }
}

/**
 * Server Action: Keluar dari akun (Logout).
 */
export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    await deleteSessionCookie();
    return { success: true };
  } catch (error) {
    console.error("[logoutAction error]:", error);
    return { success: false };
  }
}

/**
 * Helper Server-side: Memastikan pemanggil action sudah login.
 * Digunakan untuk memproteksi Server Actions yang membutuhkan user terautentikasi.
 */
export async function requireAuthUser(): Promise<SafeUser> {
  const user = await getCurrentUserAction();
  if (!user) {
    throw new Error("UNAUTHORIZED: Anda harus masuk terlebih dahulu untuk melakukan aksi ini.");
  }
  return user;
}
