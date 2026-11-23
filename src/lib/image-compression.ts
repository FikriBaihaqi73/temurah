/**
 * Mengonversi gambar file/base64 menjadi WebP dan mengompres ukurannya
 * langsung di sisi browser sebelum dikirim ke Server Actions / Cloudinary.
 *
 * @param fileOrBase64 File gambar atau data URI base64
 * @param maxWidth Lebar maksimal (default 1280px)
 * @param maxHeight Tinggi maksimal (default 1280px)
 * @param quality Kualitas kompresi WebP (0.1 - 1.0, default 0.8)
 * @returns Promise<string> Base64 data URI dalam format image/webp
 */
export async function convertAndCompressToWebP(
  fileOrBase64: File | string,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    let src = "";

    if (typeof fileOrBase64 === "string") {
      src = fileOrBase64;
    } else {
      src = URL.createObjectURL(fileOrBase64);
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Hitung dimensi baru dengan mempertahankan aspek rasio
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        if (typeof fileOrBase64 !== "string") URL.revokeObjectURL(src);
        reject(new Error("Gagal menginisialisasi canvas untuk kompresi WebP."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Konversi ke WebP terkompresi
      let webpBase64 = canvas.toDataURL("image/webp", quality);

      // Fallback jika browser sangat lama tidak mendukung toDataURL("image/webp")
      if (!webpBase64.startsWith("data:image/webp")) {
        webpBase64 = canvas.toDataURL("image/jpeg", quality);
      }

      if (typeof fileOrBase64 !== "string") {
        URL.revokeObjectURL(src);
      }

      resolve(webpBase64);
    };

    img.onerror = (err) => {
      if (typeof fileOrBase64 !== "string") URL.revokeObjectURL(src);
      reject(new Error("Gagal memuat gambar untuk proses kompresi WebP."));
    };

    img.src = src;
  });
}
