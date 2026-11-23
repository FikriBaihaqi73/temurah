import { UserPreference } from "@/generated/prisma/enums";
import type { UserRole } from "@/features/auth/validations";

// Map database enum to frontend role & badge
export function preferenceToRoleAndBadge(preference: UserPreference): { role: UserRole; badge: string } {
  switch (preference) {
    case UserPreference.STUDENT:
      return { role: "Mahasiswa", badge: "Hemat Pelajar 🎓" };
    case UserPreference.WORKER:
      return { role: "Pekerja / Karyawan", badge: "Smart Spender 💼" };
    case UserPreference.HOUSEWIFE:
      return { role: "Ibu Rumah Tangga", badge: "Ahli Pasar 🏠" };
    case UserPreference.MSME_OWNER:
      return { role: "Pemilik UMKM / Usaha", badge: "Mitra Lokal 🏪" };
    case UserPreference.GENERAL:
    default:
      return { role: "Pencari Diskon Umum", badge: "Deal Hunter 🛍️" };
  }
}

// Map frontend role to database enum
export function roleToPreference(role: UserRole): UserPreference {
  switch (role) {
    case "Mahasiswa":
      return UserPreference.STUDENT;
    case "Pekerja / Karyawan":
      return UserPreference.WORKER;
    case "Ibu Rumah Tangga":
      return UserPreference.HOUSEWIFE;
    case "Pemilik UMKM / Usaha":
      return UserPreference.MSME_OWNER;
    case "Pencari Diskon Umum":
    default:
      return UserPreference.GENERAL;
  }
}
