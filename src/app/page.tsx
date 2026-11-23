"use client";

import { useState, useRef, useEffect } from "react";
import { 
  SlidersHorizontal,
  ChevronDown,
  Flame,
  Clock,
  Percent,
  Filter
} from "lucide-react";
import { HeaderNav } from "@/components/HeaderNav";
import { PromoCard } from "@/features/promo";
import { PromoDetailSheet } from "@/features/promo";
import type { PromoPost } from "@/lib/mock-data";
import { getPromotionsAction } from "@/features/promo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", label: "Semua Kategori" },
  { id: "Kebutuhan Pokok", label: "Kebutuhan Pokok" },
  { id: "Sayur & Bumbu", label: "Sayur & Bumbu" },
  { id: "Minuman & Susu", label: "Susu & Minuman" },
  { id: "Pembersih Rumah", label: "Pembersih Rumah" },
];

const STORE_TYPES = ["Semua Toko", "Supermarket", "Pasar Tradisional", "Minimarket", "Toko Lokal"];

export default function LandingPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStoreType, setSelectedStoreType] = useState("Semua Toko");
  const [selectedLocation, setSelectedLocation] = useState("Semua Area");
  const [selectedRadius, setSelectedRadius] = useState(0); // 0 = Tanpa radius / seluruh area
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [promos, setPromos] = useState<PromoPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk Detail Sheet Promo Aktif
  const [activeDetailPromo, setActiveDetailPromo] = useState<PromoPost | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);

  // Minta izin lokasi otomatis saat pertama kali halaman dimuat (Auto-detect Geolocation)
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setUserCoords({ lat, lng });

            // Reverse geocode untuk mendapatkan nama wilayah
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
              "Lokasi Sekitar";
            setSelectedLocation(area);
          } catch (e) {
            console.error("Auto geocode error:", e);
            setSelectedLocation("Lokasi Saya");
          }
        },
        (err) => {
          // User menolak atau GPS belum aktif -> tetap tampilkan seluruh area tanpa error mengganggu
          console.log("Izin lokasi belum diberikan atau ditolak:", err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Muat promosi dari database server berdasarkan filter, pencarian, wilayah & radius
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const res = await getPromotionsAction({
          searchQuery,
          category: selectedCategory,
          storeType: selectedStoreType,
          area: selectedLocation,
          userLat: userCoords?.lat,
          userLng: userCoords?.lng,
          radiusKm: selectedRadius,
        });
        if (isMounted) {
          if (res.success && res.data) {
            setPromos(res.data);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Gagal memuat promo live:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }, searchQuery ? 250 : 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory, selectedStoreType, selectedLocation, selectedRadius, userCoords]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Section 1: Promo Terpopuler / Banyak Divalidasi
  const popularPosts = [...promos]
    .sort((a, b) => b.confirmedCount - a.confirmedCount)
    .slice(0, 4);

  // Section 2: Diskon Terbesar (%)
  const biggestDiscountPosts = [...promos]
    .sort((a, b) => b.discountPercentage - a.discountPercentage)
    .slice(0, 4);

  // Section 3: Promo Terbaru (sudah terurut dari server)
  const latestPosts = [...promos];

  const activeFiltersCount = 
    (selectedCategory !== "all" ? 1 : 0) + 
    (selectedStoreType !== "Semua Toko" ? 1 : 0) +
    (selectedLocation !== "Semua Area" ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSelectedStoreType("Semua Toko");
    setSelectedLocation("Semua Area");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-16">
      {/* Mobile-First Header */}
      <HeaderNav
        selectedLocation={selectedLocation}
        onLocationChange={(loc, coords) => {
          setSelectedLocation(loc);
          setUserCoords(coords ?? null);
        }}
        selectedRadius={selectedRadius}
        onRadiusChange={(r) => setSelectedRadius(r)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userCoords={userCoords}
      />

      {/* Baris Ringkasan Komunitas */}
      <div className="border-b border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5 truncate">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">
              <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{promos.length} promo terverifikasi</strong> di sekitarmu
            </span>
          </div>

          {/* Tombol Filter Popover */}
          <div className="relative shrink-0 ml-2" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium transition-colors",
                isFilterOpen || activeFiltersCount > 0
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
              )}
            >
              <Filter className="h-2.5 w-2.5" />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="rounded-full bg-red-600 px-1 text-[9px] text-white">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className="h-2.5 w-2.5" />
            </button>

            {/* Filter Dropdown */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-1.5 w-72 rounded border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Filter Data</span>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={handleResetFilters}
                      className="text-[11px] text-red-600 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Kategori */}
                <div className="mt-2.5">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Kategori</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "rounded border px-2 py-0.5 text-[11px] transition-colors",
                          selectedCategory === cat.id
                            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipe Toko */}
                <div className="mt-3 border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Tipe Toko</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {STORE_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedStoreType(type)}
                        className={cn(
                          "rounded border px-2 py-0.5 text-[11px] transition-colors",
                          selectedStoreType === type
                            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3 border-t border-zinc-100 pt-2 dark:border-zinc-800 flex justify-end">
                  <Button size="sm" className="h-7 text-xs" onClick={() => setIsFilterOpen(false)}>
                    Selesai
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Sections Content */}
      <main className="mx-auto max-w-7xl px-3 sm:px-6 pt-3 space-y-7">
        {/* Filter Pills Jika Aktif */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-[11px] text-zinc-500">
            <span>Filter:</span>
            {selectedLocation !== "Semua Area" && (
              <Badge variant="secondary" className="gap-1 rounded-sm text-[10px] py-0 px-1.5">
                {selectedLocation}
                <button onClick={() => setSelectedLocation("Semua Area")}>×</button>
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1 rounded-sm text-[10px] py-0 px-1.5">
                {selectedCategory}
                <button onClick={() => setSelectedCategory("all")}>×</button>
              </Badge>
            )}
            {selectedStoreType !== "Semua Toko" && (
              <Badge variant="secondary" className="gap-1 rounded-sm text-[10px] py-0 px-1.5">
                {selectedStoreType}
                <button onClick={() => setSelectedStoreType("Semua Toko")}>×</button>
              </Badge>
            )}
            <button
              onClick={handleResetFilters}
              className="text-[10px] text-red-600 hover:underline ml-1"
            >
              Reset
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 py-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded border border-zinc-200 bg-white p-2.5 sm:p-3 dark:border-zinc-800 dark:bg-zinc-900 space-y-2"
              >
                <div className="aspect-square w-full rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : promos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
            <SlidersHorizontal className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Tidak ada promo yang sesuai
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              Coba ubah kata kunci pencarian atau sesuaikan filter kategori, toko, dan wilayah.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-4 text-xs"
            >
              Reset Semua Filter
            </Button>
          </div>
        ) : (
          <>
            {/* SECTION 1: Sedang Ramai / Populer */}
            <section>
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-red-600 fill-red-600" />
                  <h2 className="text-xs sm:text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
                    Paling Banyak Divalidasi Warga
                  </h2>
                </div>
                <span className="text-[11px] text-zinc-400 font-medium">Banyak Bukti</span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-3 md:grid-cols-4 sm:overflow-visible sm:pb-0">
                {popularPosts.map((promo) => (
                  <div key={promo.id} className="w-[145px] sm:w-auto shrink-0 sm:shrink">
                    <PromoCard promo={promo} onSelect={(p) => setActiveDetailPromo(p)} />
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 2: Diskon Terbesar */}
            <section>
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-red-600" />
                  <h2 className="text-xs sm:text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
                    Potongan Harga Terbesar
                  </h2>
                </div>
                <span className="text-[11px] text-zinc-400 font-medium">Hemat s/d 36%</span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-3 md:grid-cols-4 sm:overflow-visible sm:pb-0">
                {biggestDiscountPosts.map((promo) => (
                  <div key={promo.id} className="w-[145px] sm:w-auto shrink-0 sm:shrink">
                    <PromoCard promo={promo} onSelect={(p) => setActiveDetailPromo(p)} />
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 3: Terbaru Diunggah */}
            <section>
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  <h2 className="text-xs sm:text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
                    Promo Terbaru Masuk
                  </h2>
                </div>
                <span className="text-[11px] text-zinc-400 font-medium">{latestPosts.length} promo</span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                {latestPosts.map((promo) => (
                  <PromoCard key={promo.id} promo={promo} onSelect={(p) => setActiveDetailPromo(p)} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Sheet Detail Promo (Slide-over di Desktop, Bottom Sheet di Mobile) */}
      <PromoDetailSheet
        promo={activeDetailPromo}
        onClose={() => setActiveDetailPromo(null)}
        onConfirm={(id) => {
          console.log("Confirmed deal:", id);
        }}
        onDelete={(id) => {
          setPromos((prev) => prev.filter((p) => p.id !== id));
          setActiveDetailPromo(null);
        }}
      />

      {/* Footer Minimalis */}
      <footer className="mt-12 border-t border-zinc-200 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
        <p>Temurah — Proyek Berbagi Diskon Lokal & Validasi Komunitas.</p>
      </footer>
    </div>
  );
}
