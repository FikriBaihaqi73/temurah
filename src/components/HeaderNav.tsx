"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  MapPin, 
  Check, 
  Plus, 
  Tag, 
  LogIn, 
  LogOut, 
  Loader2, 
  Navigation, 
  ChevronDown, 
  Compass, 
  User, 
  Settings,
  Bookmark,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { useAuth, EditProfileModal } from "@/features/auth";
import { getSafeAvatar } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const RADIUS_OPTIONS = [
  { value: 0, label: "🌐 Tanpa Radius", desc: "Semua promo se-Indonesia / Global" },
  { value: 5, label: "5 km", desc: "Radius Sekitar Lingkungan" },
  { value: 10, label: "10 km", desc: "Radius Standar (Default)" },
];

interface HeaderNavProps {
  selectedLocation: string;
  onLocationChange: (loc: string, coords?: { lat: number; lng: number }) => void;
  selectedRadius: number;
  onRadiusChange: (radiusKm: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  userCoords?: { lat: number; lng: number } | null;
}

export function HeaderNav({
  selectedLocation,
  onLocationChange,
  selectedRadius = 10,
  onRadiusChange,
  searchQuery,
  onSearchChange,
  userCoords,
}: HeaderNavProps) {
  const { user, openAuthModal, logout } = useAuth();
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [openLocationMenu, setOpenLocationMenu] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [customKmInput, setCustomKmInput] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  const locationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setOpenProfileMenu(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setOpenLocationMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Request browser GPS location & reverse geocode
  const handleRequestLocation = (overrideRadius?: number) => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung deteksi lokasi (Geolocation).");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          const area =
            data.address?.city_district ||
            data.address?.city ||
            data.address?.county ||
            data.address?.town ||
            data.address?.suburb ||
            "Lokasi Terdekat";
          onLocationChange(area, { lat, lng });
          if (overrideRadius) {
            onRadiusChange(overrideRadius);
          }
        } catch (e) {
          console.error("Gagal reverse geocoding:", e);
          onLocationChange("Lokasi Saya (GPS)", { lat: pos.coords.latitude, lng: pos.coords.longitude });
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn("Izin lokasi ditolak atau gagal:", err);
        setIsLocating(false);
        if (err.code === 1) {
          alert("Izin lokasi belum diberikan. Silakan aktifkan izin lokasi di browser Anda.");
        } else {
          alert("Gagal mendeteksi lokasi saat ini. Coba periksa koneksi GPS Anda.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const hasActiveGps = !!userCoords;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Baris 1: Logo, Area, & Action */}
      <div className="mx-auto flex h-12 sm:h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
        {/* Brand & Location Trigger */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-1.5 cursor-pointer py-1">
            <div className="relative h-7 w-28 sm:h-8 sm:w-32 shrink-0">
              <Image
                src="/temurah-logo.webp"
                alt="Temurah"
                fill
                sizes="(max-width: 640px) 112px, 128px"
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* Tombol Deteksi Lokasi & Pilihan Radius Popover */}
          <div className="relative" ref={locationRef}>
            <button
              type="button"
              onClick={() => {
                if (!hasActiveGps && selectedLocation === "Semua Area") {
                  handleRequestLocation();
                }
                setOpenLocationMenu(!openLocationMenu);
              }}
              disabled={isLocating}
              className={cn(
                "flex items-center gap-1 rounded border px-2 py-1 text-[11px] sm:text-xs transition-colors",
                hasActiveGps
                  ? "border-red-200 bg-red-50/70 text-red-700 hover:bg-red-100/70 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
                "disabled:opacity-70"
              )}
              title="Atur lokasi GPS dan radius pencarian diskon"
            >
              {isLocating ? (
                <Loader2 className="h-3 w-3 text-red-600 animate-spin shrink-0" />
              ) : (
                <Navigation className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0", hasActiveGps ? "text-red-600" : "text-zinc-500")} />
              )}
              <span className="max-w-[85px] sm:max-w-none truncate font-medium">
                {isLocating
                  ? "Mencari Lokasi..."
                  : selectedLocation === "Semua Area"
                  ? "Pilih Lokasi"
                  : selectedRadius === 0
                  ? `${selectedLocation} (Tanpa Radius)`
                  : `${selectedLocation} (${selectedRadius}km)`}
              </span>
              <ChevronDown className="h-2.5 w-2.5 text-zinc-400 shrink-0" />
            </button>

            {/* Dropdown Menu Lokasi & Radius */}
            {openLocationMenu && (
              <div className="absolute left-0 mt-1.5 w-64 rounded-lg border border-zinc-200 bg-white p-2.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <Compass className="h-3.5 w-3.5 text-red-600" />
                    Lokasi & Jangkauan
                  </span>
                  {selectedLocation !== "Semua Area" && (
                    <button
                      onClick={() => {
                        onLocationChange("Semua Area", undefined);
                        setOpenLocationMenu(false);
                      }}
                      className="text-[10px] text-zinc-400 hover:text-red-600 dark:hover:text-red-400 font-medium"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>

                {/* Tombol Ambil Ulang GPS */}
                <button
                  type="button"
                  onClick={() => handleRequestLocation()}
                  disabled={isLocating}
                  className="flex w-full items-center justify-between rounded-md bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 font-medium mb-3 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    {isLocating ? (
                      <Loader2 className="h-3.5 w-3.5 text-red-600 animate-spin" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5 text-red-600" />
                    )}
                    <span>{hasActiveGps ? "Perbarui Lokasi GPS" : "Deteksi Lokasi GPS Saya"}</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">GPS Browser</span>
                </button>

                {/* Pilihan Radius */}
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 px-1 mb-1">
                    Pilih Radius Promo:
                  </div>
                  {RADIUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onRadiusChange(opt.value);
                        if (!hasActiveGps && selectedLocation === "Semua Area") {
                          handleRequestLocation(opt.value);
                        }
                        setIsCustomMode(false);
                        setOpenLocationMenu(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded px-2 py-1.5 text-xs transition-colors",
                        selectedRadius === opt.value && !isCustomMode
                          ? "bg-red-50 text-red-700 font-semibold dark:bg-red-950/50 dark:text-red-300"
                          : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-xs">{opt.label}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">{opt.desc}</span>
                      </div>
                      {selectedRadius === opt.value && !isCustomMode && (
                        <Check className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      )}
                    </button>
                  ))}

                  {/* Opsi Custom Radius */}
                  <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    {!isCustomMode && !RADIUS_OPTIONS.some((o) => o.value === selectedRadius) ? (
                      <div className="flex items-center justify-between px-2 py-1.5 text-xs bg-red-50 text-red-700 font-semibold dark:bg-red-950/50 dark:text-red-300 rounded">
                        <span>Custom: {selectedRadius} km</span>
                        <button
                          type="button"
                          onClick={() => setIsCustomMode(true)}
                          className="text-[10px] underline hover:text-red-800"
                        >
                          Ubah
                        </button>
                      </div>
                    ) : isCustomMode ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const val = parseFloat(customKmInput);
                          if (!isNaN(val) && val > 0) {
                            onRadiusChange(Math.round(val));
                            if (!hasActiveGps && selectedLocation === "Semua Area") {
                              handleRequestLocation(Math.round(val));
                            }
                            setIsCustomMode(false);
                            setOpenLocationMenu(false);
                          }
                        }}
                        className="p-1.5 bg-zinc-50 dark:bg-zinc-800/60 rounded flex items-center gap-1.5 mt-1"
                      >
                        <input
                          type="number"
                          min="1"
                          max="20000"
                          step="1"
                          placeholder="Ketik Km (misal: 7)..."
                          value={customKmInput}
                          onChange={(e) => setCustomKmInput(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs focus:outline-hidden focus:border-red-500"
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={!customKmInput || parseFloat(customKmInput) <= 0}
                          className="shrink-0 bg-red-600 hover:bg-red-700 text-white rounded px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50"
                        >
                          Terapkan
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomMode(true);
                          setCustomKmInput(selectedRadius > 0 ? String(selectedRadius) : "");
                        }}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex flex-col text-left">
                          <span className="text-xs">🎯 Custom Radius (Km)</span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">Tentukan jarak bebas sesuai kebutuhan</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Header: Jika login -> Tampil "Bagi Diskon" & Avatar | Jika belum -> Tampil "Masuk" */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/submit">
                <Button
                  variant="primary"
                  size="sm"
                  className="h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-xs gap-1"
                >
                  <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Bagi Diskon</span>
                </Button>
              </Link>

              {/* Profile Avatar & Dropdown Logout */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setOpenProfileMenu(!openProfileMenu)}
                  className="h-7 w-7 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 flex items-center justify-center cursor-pointer bg-zinc-100 dark:bg-zinc-800"
                  title={user.name}
                >
                  <img src={getSafeAvatar(user.avatar)} alt={user.name} className="h-full w-full object-cover" />
                </button>

                {openProfileMenu && (
                  <div className="absolute right-0 mt-1 w-48 rounded-lg border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2 py-1.5 text-[11px] border-b border-zinc-100 dark:border-zinc-800 mb-1">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300 font-medium">
                        {user.badge}
                      </span>
                    </div>

                    {/* Tombol Halaman Bookmark Tersimpan */}
                    <Link
                      href="/bookmarks"
                      onClick={() => setOpenProfileMenu(false)}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <Bookmark className="h-3.5 w-3.5 text-red-600" />
                      <span>Promo Tersimpan</span>
                    </Link>

                    {/* Tombol Panel Admin - Hanya Tampil Jika Akun Adalah Admin */}
                    {user.isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setOpenProfileMenu(false)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                        <span>Dashboard Admin</span>
                      </Link>
                    )}

                    {/* Tombol Pengaturan & Edit Profil */}
                    <button
                      onClick={() => {
                        setOpenProfileMenu(false);
                        setIsEditProfileOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <Settings className="h-3.5 w-3.5 text-zinc-500" />
                      <span>Edit Profil & Password</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setOpenProfileMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors mt-0.5 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Keluar</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => openAuthModal("Masuk untuk mulai membagikan dan memvalidasi diskon.")}
              className="h-7 sm:h-8 px-3 text-[11px] sm:text-xs gap-1.5 font-semibold"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Masuk</span>
            </Button>
          )}
        </div>
      </div>

      {/* Baris 2: Search Input Global */}
      <div className="border-t border-zinc-100 dark:border-zinc-800/80 px-3 py-1.5 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SearchInput
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange("")}
            placeholder="Cari promo minyak, beras, telur, supermarket terdekat..."
          />
        </div>
      </div>

      {/* Modal Edit Profil & Password */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </header>
  );
}
