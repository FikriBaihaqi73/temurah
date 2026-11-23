"use server";

import cloudinary from "@/lib/cloudinary";
import { getCurrentUserAction } from "@/features/auth/actions";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface UploadActionResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Fallback lokal: Menyimpan gambar base64 ke direktori public/uploads/
 * Berguna saat server offline, tidak ada koneksi internet, atau Cloudinary mengalami DNS failure (ENOTFOUND).
 */
async function saveLocalImageFallback(
  imageData: string,
  subfolder: string = "promotions"
): Promise<string> {
  // Parsing base64 data URL
  const matches = imageData.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);
  await fs.mkdir(uploadDir, { recursive: true });

  const randomName = `${crypto.randomBytes(12).toString("hex")}.webp`;
  const filePath = path.join(uploadDir, randomName);

  if (matches && matches.length === 3) {
    const buffer = Buffer.from(matches[2], "base64");
    await fs.writeFile(filePath, buffer);
  } else {
    // Jika format buffer langsung atau plain base64
    const buffer = Buffer.from(imageData, "base64");
    await fs.writeFile(filePath, buffer);
  }

  return `/uploads/${subfolder}/${randomName}`;
}

/**
 * Server Action: Mengunggah gambar bukti promosi ke Cloudinary dengan fallback lokal otomatis.
 * Menerima string Base64 Data URL atau URL gambar.
 * Hanya dapat dipanggil oleh pengguna yang sudah terautentikasi.
 */
export async function uploadPromoImageAction(
  imageData: string
): Promise<UploadActionResult> {
  try {
    // 1. Validasi autentikasi pengguna
    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      return {
        success: false,
        error: "Silakan login terlebih dahulu untuk mengunggah foto promo.",
      };
    }

    // 2. Validasi payload gambar
    if (!imageData || typeof imageData !== "string") {
      return {
        success: false,
        error: "Data gambar tidak valid atau kosong.",
      };
    }

    // Jika gambar sudah berupa URL eksternal (misal sample Unsplash atau path lokal)
    if (
      imageData.startsWith("http://") ||
      imageData.startsWith("https://") ||
      imageData.startsWith("/uploads/")
    ) {
      return {
        success: true,
        url: imageData,
      };
    }

    // Batasi ukuran payload base64 (maks ~15MB dalam string)
    if (imageData.length > 20 * 1024 * 1024) {
      return {
        success: false,
        error: "Ukuran foto terlalu besar. Maksimal 10 MB.",
      };
    }

    // 3. Cek ketersediaan konfigurasi Cloudinary
    const isCloudinaryConfigured = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (isCloudinaryConfigured) {
      try {
        // Coba upload ke Cloudinary terlebih dahulu
        const uploadResponse = await cloudinary.uploader.upload(imageData, {
          folder: "temurah/promotions",
          resource_type: "image",
          format: "webp",
          transformation: [
            { width: 1280, height: 1280, crop: "limit" },
            { quality: "auto:eco" },
            { fetch_format: "webp" },
          ],
        });

        return {
          success: true,
          url: uploadResponse.secure_url,
        };
      } catch (cloudErr: unknown) {
        console.warn(
          "Cloudinary upload gagal atau koneksi DNS offline, beralih ke penyimpanan lokal:",
          cloudErr instanceof Error ? cloudErr.message : cloudErr
        );
        // Fallback otomatis ke penyimpanan lokal saat offline / DNS ENOTFOUND
        const localUrl = await saveLocalImageFallback(imageData, "promotions");
        return {
          success: true,
          url: localUrl,
        };
      }
    }

    // Jika konfigurasi Cloudinary tidak ada, langsung simpan lokal
    const localUrl = await saveLocalImageFallback(imageData, "promotions");
    return {
      success: true,
      url: localUrl,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan saat mengunggah foto.";
    console.error("UploadPromoImageAction fatal error:", error);
    return {
      success: false,
      error: `Gagal memproses foto: ${message}`,
    };
  }
}

/**
 * Server Action: Mengunggah gambar avatar pengguna ke Cloudinary dengan fallback lokal otomatis.
 */
export async function uploadAvatarImageAction(
  imageData: string
): Promise<UploadActionResult> {
  try {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      return {
        success: false,
        error: "Silakan login terlebih dahulu untuk mengunggah foto profil.",
      };
    }

    if (!imageData || typeof imageData !== "string") {
      return {
        success: false,
        error: "Data gambar tidak valid atau kosong.",
      };
    }

    if (
      imageData.startsWith("http://") ||
      imageData.startsWith("https://") ||
      imageData.startsWith("/uploads/")
    ) {
      return {
        success: true,
        url: imageData,
      };
    }

    if (imageData.length > 20 * 1024 * 1024) {
      return {
        success: false,
        error: "Ukuran foto terlalu besar. Maksimal 10 MB.",
      };
    }

    const isCloudinaryConfigured = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (isCloudinaryConfigured) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(imageData, {
          folder: "temurah/avatars",
          resource_type: "image",
          format: "webp",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto:eco" },
            { fetch_format: "webp" },
          ],
        });

        return {
          success: true,
          url: uploadResponse.secure_url,
        };
      } catch (cloudErr: unknown) {
        console.warn(
          "Cloudinary avatar upload offline / DNS error, fallback ke lokal:",
          cloudErr instanceof Error ? cloudErr.message : cloudErr
        );
        const localUrl = await saveLocalImageFallback(imageData, "avatars");
        return {
          success: true,
          url: localUrl,
        };
      }
    }

    const localUrl = await saveLocalImageFallback(imageData, "avatars");
    return {
      success: true,
      url: localUrl,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan saat mengunggah foto profil.";
    console.error("UploadAvatarImageAction fatal error:", error);
    return {
      success: false,
      error: `Gagal memproses foto profil: ${message}`,
    };
  }
}

