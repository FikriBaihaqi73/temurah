"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  MapPin, 
  Store, 
  Calendar, 
  Clock,
  Tag, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapLocationModal } from "@/components/ui/map-location-modal";
import { useAuth } from "@/features/auth";
import { formatRupiah, cn } from "@/lib/utils";
import { createPromotionAction } from "@/features/promo";
import { uploadPromoImageAction } from "@/features/upload";
import { convertAndCompressToWebP } from "@/lib/image-compression";

const CATEGORIES = [
  "Kebutuhan Pokok",
  "Sayur & Bumbu",
  "Minuman & Susu",
  "Pembersih Rumah",
  "Daging & Ikan",
  "Camilan & Roti",
  "Perlengkapan Bayi",
  "Lainnya",
];

const STORE_TYPES = [
  "Supermarket",
  "Pasar Tradisional",
  "Minimarket",
  "Toko Lokal / Kelontong",
  "Toko Buah & Sayur",
];

export default function SubmitDealPage() {
  const router = useRouter();
  const { user, isLoading, requireAuth } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      requireAuth(() => {}, "Silakan masuk terlebih dahulu untuk membagikan temuan diskon ke warga.");
    }
  }, [user, isLoading, requireAuth]);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Kebutuhan Pokok");
  const [storeType, setStoreType] = useState("Supermarket");
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [originalPrice, setOriginalPrice] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  
  // WAKTU STRUKTUR: Tanggal & Jam Kedaluwarsa
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryTime, setExpiryTime] = useState("21:00");
  const [stockCondition, setStockCondition] = useState("Stok Masih Banyak");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    queueMicrotask(() => {
      setExpiryDate(today);
    });
  }, []);

  const [notes, setNotes] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Kalkulasi persentase diskon
  const origNum = parseInt(originalPrice.replace(/\D/g, "")) || 0;
  const promoNum = parseInt(promoPrice.replace(/\D/g, "")) || 0;
  const discountPercent = origNum > promoNum && origNum > 0
    ? Math.round(((origNum - promoNum) / origNum) * 100)
    : 0;
  const totalHemat = origNum > promoNum ? origNum - promoNum : 0;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Ukuran foto maksimal 10 MB.");
        return;
      }
      setError("");
      setIsUploadingPhoto(true);
      try {
        // 1. Konversi dan kompresi otomatis ke format WebP di client
        const webpCompressed = await convertAndCompressToWebP(file, 1400, 1400, 0.82);
        setImagePreview(webpCompressed);

        // 2. Upload ke Cloudinary (dengan auto fallback lokal jika DNS offline)
        const uploadRes = await uploadPromoImageAction(webpCompressed);
        if (uploadRes.success && uploadRes.url) {
          setCloudinaryUrl(uploadRes.url);
        } else {
          // Fallback darurat jika ada kendala
          setCloudinaryUrl(webpCompressed);
        }
      } catch (err) {
        console.error("Gagal kompresi / upload foto:", err);
        setError("Terjadi kesalahan saat memproses foto.");
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleUseSamplePhoto = (url: string) => {
    setImagePreview(url);
    setCloudinaryUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Nama produk promo wajib diisi.");
      return;
    }
    if (!storeName.trim()) {
      setError("Nama toko/pasar wajib diisi.");
      return;
    }
    if (!promoNum) {
      setError("Harga promo wajib diisi.");
      return;
    }
    if (origNum > 0 && promoNum >= origNum) {
      setError("Harga promo harus lebih murah dari harga normal.");
      return;
    }
    if (isUploadingPhoto) {
      setError("Harap tunggu hingga proses upload foto ke Cloudinary selesai.");
      return;
    }
    if (!imagePreview || !cloudinaryUrl) {
      setError("Wajib menyertakan bukti foto label promo rak / struk toko.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createPromotionAction({
        title: title.trim(),
        category,
        storeType,
        storeName: storeName.trim(),
        address: address.trim() || storeName.trim(),
        lat: selectedCoords?.lat ?? -7.7829,
        lng: selectedCoords?.lng ?? 110.3671,
        originalPrice: origNum,
        promoPrice: promoNum,
        expiryDate,
        expiryTime,
        stockCondition,
        notes: notes.trim(),
        imageUrl: cloudinaryUrl,
      });

      if (result.success) {
        setIsSubmitting(false);
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1000);
      } else {
        setIsSubmitting(false);
        setError(result.error || "Gagal mengunggah promo. Silakan coba lagi.");
      }
    } catch {
      setIsSubmitting(false);
      setError("Terjadi kesalahan teknis saat mengirim data promo.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-xs text-zinc-400">Memeriksa status sesi warga...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      {/* Top Bar Ringkas */}
      <div className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span>Kontributor:</span>
            <strong className="text-zinc-200">{user.name}</strong>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 pt-6 sm:px-6">
        <div className="mb-6 space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-400">
            <Camera className="h-3 w-3" />
            <span>Verifikasi Komunitas Terbuka</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Bagi Temuan Diskon Baru
          </h1>
          <p className="text-xs text-zinc-400">
            Sertakan bukti foto label rak atau struk agar cepat divalidasi oleh warga sekitar.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Promo berhasil dibagikan! Mengalihkan ke katalog warga...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. UPLOAD BUKTI FOTO */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-white">
                Bukti Foto Label Rak / Struk Toko <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Foto langsung label harga di rak toko, spanduk diskon, atau struk belanja.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />

            {isUploadingPhoto ? (
              <div className="relative aspect-16/9 w-full rounded-lg overflow-hidden border border-red-500/50 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center animate-pulse">
                <Loader2 className="h-8 w-8 text-red-500 animate-spin mb-2" />
                <p className="text-xs font-bold text-white">Mengunggah Foto ke Cloudinary...</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Mohon tunggu, foto sedang dikonversi ke WebP & dikompres.</p>
              </div>
            ) : imagePreview ? (
              <div className="relative aspect-16/9 w-full rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950">
                <img
                  src={imagePreview}
                  alt="Bukti Promo"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setCloudinaryUrl(null);
                  }}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900/90 text-white hover:bg-red-600 transition-colors"
                  title="Hapus foto"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Foto Terunggah</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700/80 bg-zinc-950/40 p-6 text-center hover:border-red-500 hover:bg-zinc-900/50 cursor-pointer transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 group-hover:bg-red-600 group-hover:text-white transition-colors mb-2">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-zinc-200">
                  Ambil Foto / Pilih Gambar Bukti
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Format JPG, PNG, atau WebP (Maks. 10MB, otomatis dikompres ke WebP)
                </p>
              </div>
            )}

            {!imagePreview && (
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Tes Cepat Demo:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUseSamplePhoto("https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80")}
                    className="rounded border border-zinc-700 bg-zinc-800/80 px-2 py-1 text-zinc-300 hover:text-white hover:border-zinc-500"
                  >
                    Foto Minyak
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseSamplePhoto("https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80")}
                    className="rounded border border-zinc-700 bg-zinc-800/80 px-2 py-1 text-zinc-300 hover:text-white hover:border-zinc-500"
                  >
                    Foto Cabai
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseSamplePhoto("https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80")}
                    className="rounded border border-zinc-700 bg-zinc-800/80 px-2 py-1 text-zinc-300 hover:text-white hover:border-zinc-500"
                  >
                    Foto Telur
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. DETAIL PRODUK & HARGA */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <Tag className="h-3.5 w-3.5 text-red-500" />
              <span>Informasi Produk & Harga</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nama Produk & Ukuran <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Minyak Goreng Filma Pouch 2L"
                required
                className="h-10 text-xs bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Kategori Produk <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-md border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-100 focus:border-red-500 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-zinc-900 text-zinc-100">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Harga Normal Coret (Rp)
                </label>
                <Input
                  type="text"
                  value={originalPrice}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setOriginalPrice(raw ? new Intl.NumberFormat("id-ID").format(parseInt(raw)) : "");
                  }}
                  placeholder="Contoh: 38.000"
                  className="h-10 text-xs bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Harga Promo Nyata (Rp) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={promoPrice}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setPromoPrice(raw ? new Intl.NumberFormat("id-ID").format(parseInt(raw)) : "");
                  }}
                  placeholder="Contoh: 28.500"
                  required
                  className="h-10 text-xs bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-red-500 font-bold text-red-500"
                />
              </div>
            </div>

            {discountPercent > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-red-950/30 border border-red-500/30 p-2.5 text-xs">
                <span className="text-zinc-300">Estimasi Potongan:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-400">Hemat {discountPercent}%</span>
                  <span className="text-zinc-400 font-mono">({formatRupiah(totalHemat)})</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. LOKASI TOKO / PASAR */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <Store className="h-3.5 w-3.5 text-red-500" />
              <span>Lokasi & Toko Penemu Promo</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Tipe Toko <span className="text-red-500">*</span>
                </label>
                <select
                  value={storeType}
                  onChange={(e) => setStoreType(e.target.value)}
                  className="w-full h-10 rounded-md border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-100 focus:border-red-500 focus:outline-none"
                >
                  {STORE_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-zinc-900 text-zinc-100">
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Nama Toko / Kios Pasar <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Contoh: Pasar Kranggan Kios Bu Siti"
                  required
                  className="h-10 text-xs bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Alamat / Patokan Jalan (Untuk Buka Peta)
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Jl. Kaliurang KM 6 No. 12 (Samping Apotek K-24)"
                  className="h-10 pl-9 text-xs bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-red-500"
                />
                <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            {/* TOMBOL PEMICU MODAL PETA LOKASI */}
            <div className="pt-1">
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Titik Peta & Navigasi
              </label>
              
              <button
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                className="group flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-950/70 p-3 text-left hover:border-red-500 hover:bg-zinc-900 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600/20 text-red-500 shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {storeName || "Buka Peta & Pilih Lokasi Toko"}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {address || "Klik untuk cari nama pasar, toko, atau deteksi lokasi GPS saat ini"}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-300 group-hover:bg-red-600 group-hover:text-white transition-colors ml-2">
                  Pilih Peta
                </span>
              </button>
            </div>
          </div>

          {/* 4. STRUKTUR WAKTU KEDALUWARSA & KONDISI STOK (DATE & TIME PICKER) */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <Clock className="h-3.5 w-3.5 text-red-500" />
              <span>Masa Berlaku Promo & Stok</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Date Input */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Berlaku Sampai Tanggal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                    className="h-10 pl-9 text-xs bg-zinc-950/80 border-zinc-800 text-white focus:border-red-500 [color-scheme:dark]"
                  />
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                </div>
              </div>

              {/* Time Input */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Jam Berakhir <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="time"
                    value={expiryTime}
                    onChange={(e) => setExpiryTime(e.target.value)}
                    required
                    className="h-10 pl-9 text-xs bg-zinc-950/80 border-zinc-800 text-white focus:border-red-500 [color-scheme:dark]"
                  />
                  <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                </div>
              </div>
            </div>

            {/* Status Ketersediaan Stok */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Kondisi Stok di Lokasi
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Stok Banyak", icon: "🟢" },
                  { label: "Stok Terbatas", icon: "🟡" },
                  { label: "Sisa Sedikit", icon: "🔴" },
                ].map((item) => {
                  const isSelected = stockCondition === item.label;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setStockCondition(item.label)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-all",
                        isSelected
                          ? "border-red-500 bg-red-950/40 text-white font-semibold"
                          : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:bg-zinc-800"
                      )}
                    >
                      <span className="text-[11px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Catatan Syarat / Ketentuan Kasir (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Contoh: Maksimal beli 2 per struk, atau khusus pembayaran pakai QRIS..."
                className="w-full rounded-md border border-zinc-800 bg-zinc-950/80 p-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* TOMBOL AKSI SUBMIT */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || isSuccess || isUploadingPhoto}
              className="w-full h-11 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                "Menerbitkan Promo..."
              ) : isUploadingPhoto ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sedang Mengunggah Foto... (Tunggu Sebentar)</span>
                </span>
              ) : (
                "Publikasikan Promo ke Warga"
              )}
            </Button>
            <p className="mt-2 text-center text-[11px] text-zinc-500">
              Dengan mengunggah, kamu berkontribusi menjaga transparansi harga kebutuhan warga lokal.
            </p>
          </div>
        </form>
      </main>

      {/* MODAL PETA INTERAKTIF: SEARCH & PILIH LOKASI SAAT INI */}
      <MapLocationModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialLat={selectedCoords?.lat}
        initialLng={selectedCoords?.lng}
        onSelectLocation={(loc) => {
          setStoreName(loc.name);
          setAddress(loc.address);
          setSelectedCoords({ lat: loc.lat, lng: loc.lng });
        }}
      />
    </div>
  );
}
