"use client";

import { useState, useRef } from "react";
import { 
  X, 
  Camera, 
  Loader2, 
  Lock, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Upload 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth";
import { USER_ROLES, type UserRole } from "@/features/auth/validations";
import { uploadAvatarImageAction } from "@/features/upload";
import { ImageCropModal } from "@/features/auth/components/ImageCropModal";
import { convertAndCompressToWebP } from "@/lib/image-compression";
import { getSafeAvatar } from "@/lib/avatar";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState(user?.name || "");
  const [role, setRole] = useState<UserRole>(user?.role || "Pencari Diskon Umum");
  const [avatar, setAvatar] = useState(getSafeAvatar(user?.avatar));
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // State untuk Crop Modal
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  if (!isOpen || !user) return null;

  // Handle Photo File Select -> Buka ImageCropModal terlebih dahulu
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("File yang diunggah harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Ukuran gambar maksimal 10MB.");
      return;
    }

    setErrorMessage("");
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      if (base64Data) {
        try {
          // Kompres awal jika gambar asli sangat besar sebelum masuk cropper
          const compressedInput = await convertAndCompressToWebP(base64Data, 1600, 1600, 0.9);
          setRawImageToCrop(compressedInput);
          setIsCropModalOpen(true);
        } catch {
          setRawImageToCrop(base64Data);
          setIsCropModalOpen(true);
        }
      }
    };
    reader.readAsDataURL(file);
    // Reset file input agar user bisa memilih gambar yang sama jika diinginkan
    e.target.value = "";
  };

  // Setelah user selesai menyesuaikan foto (geser, zoom, rotasi)
  const handleCropComplete = async (croppedBase64: string) => {
    setIsCropModalOpen(false);
    setRawImageToCrop(null);
    setAvatar(croppedBase64); // Tampilkan preview hasil potong langsung di UI

    setIsUploadingPhoto(true);
    try {
      const uploadRes = await uploadAvatarImageAction(croppedBase64);
      if (uploadRes.success && uploadRes.url) {
        setAvatar(uploadRes.url);
      }
    } catch (err) {
      console.warn("Upload avatar error, menggunakan fallback base64:", err);
      // Tetap gunakan croppedBase64 sebagai fallback
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingPhoto) return; // Cegah submit saat foto sedang diunggah
    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim()) {
      setErrorMessage("Nama tidak boleh kosong.");
      return;
    }

    if (newPassword || confirmNewPassword || currentPassword) {
      if (!currentPassword) {
        setErrorMessage("Masukkan kata sandi saat ini untuk mengubah kata sandi.");
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage("Kata sandi baru minimal 6 karakter.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setErrorMessage("Konfirmasi kata sandi baru tidak cocok.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await updateProfile({
        name: name.trim(),
        role,
        avatarUrl: avatar,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
        confirmNewPassword: confirmNewPassword || undefined,
      });

      if (res.success) {
        setSuccessMessage("Profil berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.error || "Gagal memperbarui profil.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-150">
        {/* Banner Status Upload Foto */}
        {isUploadingPhoto && (
          <div className="mb-3.5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50/90 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300 animate-pulse">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-red-600" />
              <span className="font-medium">Mengunggah foto ke Cloudinary... Harap tunggu.</span>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          disabled={isUploadingPhoto || isSubmitting}
          className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Pengaturan Profil Akun
            </h3>
            <p className="text-[11px] text-zinc-500">
              Perbarui foto, nama warga, persona, dan kata sandi.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-3.5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/70 p-2.5 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-3.5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload & Preview Foto Profil */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative group">
              <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-red-500 shadow-md bg-zinc-100 dark:bg-zinc-800">
                <img 
                  src={getSafeAvatar(avatar || user.avatar)} 
                  alt={user.name} 
                  className="h-full w-full object-cover" 
                />
              </div>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-100"
                title="Ganti Foto Profil"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Camera className="h-5 w-5 mb-0.5" />
                    <span className="text-[9px] font-semibold">Ubah</span>
                  </>
                )}
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handlePhotoSelect} 
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="mt-2 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
            >
              <Upload className="h-3 w-3" />
              <span>{isUploadingPhoto ? "Mengunggah..." : "Pilih Foto Baru"}</span>
            </button>
          </div>

          {/* Email (Readonly info) */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
              Email Akun (Permanen)
            </label>
            <Input
              type="email"
              value={user.email}
              disabled
              className="bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 cursor-not-allowed text-xs h-9"
            />
          </div>

          {/* Nama Lengkap */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nama Lengkap / Panggilan <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="text-xs h-9"
            />
          </div>

          {/* Persona Komunitas */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Persona / Peran Komunitas <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 h-9"
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Section Ganti Kata Sandi */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
              <Lock className="h-3.5 w-3.5 text-zinc-500" />
              <span>Ganti Kata Sandi (Opsional)</span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Biarkan kosong jika Anda tidak ingin mengubah kata sandi.
            </p>

            <div>
              <Input
                type="password"
                placeholder="Kata sandi saat ini"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="text-xs h-8.5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                type="password"
                placeholder="Kata sandi baru (min. 6)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="text-xs h-8.5"
              />
              <Input
                type="password"
                placeholder="Konfirmasi sandi baru"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="text-xs h-8.5"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting || isUploadingPhoto}
              className="text-xs h-8"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || isUploadingPhoto}
              className="text-xs h-8 min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  <span>Menyimpan...</span>
                </>
              ) : isUploadingPhoto ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  <span>Mengunggah Foto...</span>
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Modal Penyesuaian Foto (Geser, Zoom, Rotasi) */}
      {rawImageToCrop && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={rawImageToCrop}
          onClose={() => {
            setIsCropModalOpen(false);
            setRawImageToCrop(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
