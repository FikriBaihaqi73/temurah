"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  type RegisterInput,
  type LoginInput,
  type UpdateProfileInput,
  type UserRole,
} from "@/features/auth/validations";
import {
  setSessionCookie,
  deleteSessionCookie,
  getSession,
  roleToPreference,
  preferenceToRoleAndBadge,
  type SessionPayload,
} from "@/features/auth/session";
import { DEFAULT_AVATAR_PLACEHOLDER, getSafeAvatar } from "@/lib/avatar";

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badge: string;
  avatar: string;
  isAdmin?: boolean;
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

    // Default Avatar netral SVG (avatar kosong / siluet netral)
    const defaultAvatar = DEFAULT_AVATAR_PLACEHOLDER;

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
      isAdmin: newUser.isAdmin,
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
        isAdmin: newUser.isAdmin,
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

    if (user.isBanned) {
      return {
        success: false,
        error: `Akun Anda telah dinonaktifkan/dibanned oleh Admin. Alasan: ${user.banReason || "Pelanggaran pedoman komunitas"}.`,
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
    const avatar = getSafeAvatar(user.avatarUrl);

    // 5. Buat dan simpan session cookie
    const sessionPayload: SessionPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role,
      badge,
      avatarUrl: user.avatarUrl,
      preference: user.preference,
      isAdmin: user.isAdmin,
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
        isAdmin: user.isAdmin,
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
 * Server Action: Memperbarui profil pengguna (Nama, Persona/Role, Foto Avatar, dan Password).
 */
export async function updateProfileAction(
  data: UpdateProfileInput
): Promise<AuthActionResult> {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return {
        success: false,
        error: "UNAUTHORIZED: Silakan masuk terlebih dahulu untuk mengubah profil.",
      };
    }

    const validation = updateProfileSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Data input tidak valid.";
      return { success: false, error: firstError };
    }

    const { name, role, avatarUrl, currentPassword, newPassword } = validation.data;

    // Ambil data user dari database
    const existingUser = await prisma.user.findUnique({
      where: { id: session.sub },
    });

    if (!existingUser || existingUser.deletedAt) {
      await deleteSessionCookie();
      return {
        success: false,
        error: "Pengguna tidak ditemukan atau akun sudah dinonaktifkan.",
      };
    }

    // Persiapan update field
    const updateData: {
      name: string;
      preference: any;
      avatarUrl?: string;
      passwordHash?: string;
    } = {
      name,
      preference: roleToPreference(role),
    };

    if (avatarUrl) {
      updateData.avatarUrl = avatarUrl;
    }

    // Jika pengguna meminta ganti kata sandi
    if (newPassword && newPassword.length >= 6) {
      if (!currentPassword) {
        return {
          success: false,
          error: "Kata sandi saat ini wajib diisi untuk mengubah kata sandi.",
        };
      }

      const isCurrentValid = await bcrypt.compare(
        currentPassword,
        existingUser.passwordHash
      );

      if (!isCurrentValid) {
        return {
          success: false,
          error: "Kata sandi saat ini salah.",
        };
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    // Update di database
    const updatedUser = await prisma.user.update({
      where: { id: session.sub },
      data: updateData,
    });

    const preference = updatedUser.preference;
    const { role: newRole, badge: newBadge } = preferenceToRoleAndBadge(preference);
    const finalAvatar = getSafeAvatar(updatedUser.avatarUrl);

    // Update session cookie dengan data terbaru
    const newSessionPayload: SessionPayload = {
      sub: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: newRole,
      badge: newBadge,
      avatarUrl: updatedUser.avatarUrl,
      preference,
      isAdmin: updatedUser.isAdmin,
    };

    await setSessionCookie(newSessionPayload);

    return {
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: newRole,
        badge: newBadge,
        avatar: finalAvatar,
        isAdmin: updatedUser.isAdmin,
      },
    };
  } catch (error) {
    console.error("[updateProfileAction error]:", error);
    return {
      success: false,
      error: "Terjadi kesalahan pada server saat memperbarui profil.",
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
        isAdmin: true,
        isBanned: true,
      },
    });

    if (!user || user.deletedAt || user.isBanned) {
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
      avatar: getSafeAvatar(user.avatarUrl),
      isAdmin: user.isAdmin,
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
