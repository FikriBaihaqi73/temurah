import { z } from "zod";

export const USER_ROLES = [
  "Mahasiswa",
  "Pekerja / Karyawan",
  "Ibu Rumah Tangga",
  "Pemilik UMKM / Usaha",
  "Pencari Diskon Umum",
] as const;

export type UserRole = string;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(120, "Nama maksimal 120 karakter."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Format email tidak valid."),
    password: z
      .string()
      .min(6, "Kata sandi minimal 6 karakter.")
      .max(100, "Kata sandi terlalu panjang."),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi."),
    role: z.string().min(1, "Pilihan peran/persona wajib dipilih."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(120, "Nama maksimal 120 karakter."),
    role: z.string().min(1, "Pilihan peran/persona wajib dipilih."),
    avatarUrl: z.string().trim().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmNewPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      // Jika salah satu field password baru diisi, maka currentPassword & confirmNewPassword wajib
      if (data.newPassword || data.confirmNewPassword) {
        if (!data.currentPassword || data.currentPassword.length < 1) {
          return false;
        }
        if (!data.newPassword || data.newPassword.length < 6) {
          return false;
        }
        if (data.newPassword !== data.confirmNewPassword) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Jika ingin mengganti kata sandi, isi kata sandi saat ini dan pastikan kata sandi baru minimal 6 karakter serta cocok.",
      path: ["confirmNewPassword"],
    }
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
