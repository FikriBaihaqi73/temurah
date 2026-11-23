"use server";

import cloudinary from "@/lib/cloudinary";
import { getCurrentUserAction } from "@/features/auth/actions";

export interface UploadActionResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Server Action: Mengunggah gambar bukti promosi ke Cloudinary.
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

    // 2. Validasi kelengkapan konfigurasi Cloudinary
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return {
        success: false,
        error: "Konfigurasi Cloudinary di server belum lengkap.",
      };
    }

    // 3. Validasi payload gambar
    if (!imageData || typeof imageData !== "string") {
      return {
        success: false,
        error: "Data gambar tidak valid atau kosong.",
      };
    }

    // Jika gambar sudah berupa URL eksternal (misal sample Unsplash), kembalikan langsung
    if (imageData.startsWith("http://") || imageData.startsWith("https://")) {
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

    // 4. Unggah ke Cloudinary dengan optimasi otomatis
    const uploadResponse = await cloudinary.uploader.upload(imageData, {
      folder: "temurah/promotions",
      resource_type: "image",
      transformation: [
        { width: 1280, height: 1280, crop: "limit" }, // Batasi dimensi maks 1280px
        { quality: "auto" },                           // Kompresi kualitas cerdas
        { fetch_format: "auto" },                      // Format WebP/AVIF sesuai browser
      ],
    });

    return {
      success: true,
      url: uploadResponse.secure_url,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan saat mengunggah foto.";
    console.error("Cloudinary uploadPromoImageAction error:", error);
    return {
      success: false,
      error: `Gagal mengunggah foto ke Cloudinary: ${message}`,
    };
  }
}
