/**
 * Default clean empty/placeholder avatar in SVG Data URI format.
 * Tidak menggunakan foto wajah orang, melainkan siluet avatar netral modern.
 */
export const DEFAULT_AVATAR_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128' fill='none'%3E%3Ccircle cx='64' cy='64' r='64' fill='%23E4E4E7'/%3E%3Ccircle cx='64' cy='46' r='22' fill='%23A1A1AA'/%3E%3Cpath d='M24 108C24 88.1178 41.9086 72 64 72C86.0914 72 104 88.1178 104 108H24Z' fill='%23A1A1AA'/%3E%3C/svg%3E";

/**
 * Helper untuk memastikan avatar selalu valid (mengembalikan placeholder jika null, undefined, kosong, atau default lama).
 */
export function getSafeAvatar(avatarUrl?: string | null): string {
  if (
    !avatarUrl ||
    avatarUrl.trim() === "" ||
    avatarUrl.includes("photo-1535713875002-d1d0cf377fde")
  ) {
    return DEFAULT_AVATAR_PLACEHOLDER;
  }
  return avatarUrl;
}
