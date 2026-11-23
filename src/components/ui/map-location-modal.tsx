"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  X, 
  MapPin, 
  Search, 
  Check, 
  Loader2,
  Building2,
  Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LocationResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  type?: string;
}

interface MapLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: { name: string; address: string; lat: number; lng: number }) => void;
  initialLat?: number;
  initialLng?: number;
}

export function MapLocationModal({
  isOpen,
  onClose,
  onSelectLocation,
  initialLat = -7.7829,
  initialLng = 110.3671,
}: MapLocationModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationResult>({
    name: "Pilih / Cari Lokasi Toko",
    address: "Memuat peta...",
    lat: initialLat,
    lng: initialLng,
  });

  const [nearbyPlaces, setNearbyPlaces] = useState<LocationResult[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [onlineResults, setOnlineResults] = useState<LocationResult[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  // Ambil tempat/pasar/supermarket sekitar secara dinamis berbasis koordinat GPS user/posisi aktif
  const fetchNearbyStores = async (lat: number, lng: number) => {
    try {
      setIsLoadingNearby(true);
      // Cari supermarket, pasar, minimarket di sekitar titik koordinat menggunakan Overpass / Nominatim
      const queryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=supermarket+pasar+minimarket+toko&lat=${lat}&lon=${lng}&bounded=1&viewbox=${lng - 0.04},${lat + 0.04},${lng + 0.04},${lat - 0.04}&limit=10`;
      const res = await fetch(queryUrl);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const places: LocationResult[] = data.map((item: { display_name: string; name?: string; lat: string; lon: string; type?: string }) => ({
          name: item.name || item.display_name.split(",")[0],
          address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type,
        }));
        setNearbyPlaces(places);
      } else {
        // Fallback jika area sepi: coba pencarian umum POI terdekat
        const fallbackUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
        const fbRes = await fetch(fallbackUrl);
        const fbData = await fbRes.json();
        if (fbData && fbData.display_name) {
          setNearbyPlaces([
            {
              name: fbData.name || fbData.display_name.split(",")[0],
              address: fbData.display_name,
              lat,
              lng,
            },
          ]);
        }
      }
    } catch (e) {
      console.warn("Gagal mengambil tempat populer sekitar:", e);
    } finally {
      setIsLoadingNearby(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Otomatis deteksi GPS user saat buka modal atau gunakan initialLat/Lng
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setSelectedLocation((prev) => ({
              ...prev,
              lat: latitude,
              lng: longitude,
            }));
            fetchNearbyStores(latitude, longitude);
          },
          () => {
            fetchNearbyStores(initialLat, initialLng);
          },
          { timeout: 7000 }
        );
      } else {
        fetchNearbyStores(initialLat, initialLng);
      }

      return () => {
        document.body.style.overflow = "auto";
      };
    }
  }, [isOpen, initialLat, initialLng]);

  // Pencarian online jika user mengetik nama tempat
  useEffect(() => {
    if (!searchQuery.trim()) {
      setOnlineResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingOnline(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=7`
        );
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const results: LocationResult[] = data.map((item: { display_name: string; name?: string; lat: string; lon: string }) => ({
            name: item.name || item.display_name.split(",")[0],
            address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }));
          setOnlineResults(results);
        } else {
          setOnlineResults([]);
        }
      } catch (e) {
        console.error("Nominatim search error", e);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung deteksi lokasi (Geolocation).");
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const placeName = data.name || data.display_name?.split(",")[0] || "Lokasi Saat Ini";
          const fullAddress = data.display_name || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;

          const userLoc: LocationResult = {
            name: placeName,
            address: fullAddress,
            lat: latitude,
            lng: longitude,
          };

          setSelectedLocation(userLoc);
          fetchNearbyStores(latitude, longitude);
        } catch {
          setSelectedLocation({
            name: "Lokasi Perangkat Anda",
            address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
            lat: latitude,
            lng: longitude,
          });
        } finally {
          setIsLocatingUser(false);
        }
      },
      () => {
        setIsLocatingUser(false);
        alert("Gagal mendeteksi lokasi. Pastikan izin akses lokasi aktif di browser Anda.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleApplyLocation = () => {
    onSelectLocation(selectedLocation);
    onClose();
  };

  if (!isOpen) return null;

  const displayList = searchQuery.trim() ? onlineResults : nearbyPlaces;

  const delta = 0.005;
  const bbox = `${selectedLocation.lng - delta}%2C${selectedLocation.lat - delta}%2C${selectedLocation.lng + delta}%2C${selectedLocation.lat + delta}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${selectedLocation.lat}%2C${selectedLocation.lng}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet Responsif:
          - Mobile: Bottom Sheet menempel di bawah (h-[92vh], rounded-t-2xl)
          - Desktop: Modal tengah elegan (h-[620px], max-w-2xl, rounded-2xl)
      */}
      <div className="relative z-10 flex h-[92vh] sm:h-[620px] w-full max-w-2xl flex-col rounded-t-2xl sm:rounded-2xl border-t sm:border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* Mobile Pull-Down Indicator Bar */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-zinc-700" />
        </div>

        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5 sm:py-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-600/20 text-red-500 shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                Pilih Lokasi Toko / Pasar
              </h3>
              <p className="text-[10px] text-zinc-400 hidden sm:block">
                Cari nama tempat atau aktifkan GPS lokasi saat ini
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar & GPS Button */}
        <div className="border-b border-zinc-800/80 p-2.5 sm:p-3 space-y-2 bg-zinc-900/60 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pasar, supermarket, jalan..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-8 pr-7 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
              />
              {isSearchingOnline && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-3 w-3 animate-spin text-red-500" />
                </div>
              )}
            </div>

            {/* Tombol GPS Mobile-Optimized */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
              disabled={isLocatingUser}
              className="h-9 px-3 text-xs font-semibold border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white shrink-0 gap-1.5"
            >
              {isLocatingUser ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
              ) : (
                <Compass className="h-3.5 w-3.5 text-red-500" />
              )}
              <span>GPS Saya</span>
            </Button>
          </div>
        </div>

        {/* Content Body: Peta + List Lokasi */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          
          {/* Bagian Peta Live */}
          <div className="relative h-44 sm:h-auto sm:flex-1 bg-zinc-900 overflow-hidden border-b sm:border-b-0 sm:border-r border-zinc-800 shrink-0 sm:shrink">
            <iframe
              title="OpenStreetMap Live Modal"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={embedUrl}
              className="w-full h-full opacity-90 contrast-105"
            />

            {/* Floating Info Pin Marker di Peta */}
            <div className="absolute top-2 left-2 right-2 rounded-lg bg-zinc-950/95 border border-zinc-800 p-2 shadow-lg backdrop-blur-md">
              <div className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{selectedLocation.name}</p>
                  <p className="text-[10px] text-zinc-400 line-clamp-1">{selectedLocation.address}</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-1 right-2 text-[8px] text-zinc-500 bg-zinc-950/80 px-1 rounded pointer-events-none">
              OpenStreetMap
            </div>
          </div>

          {/* Bagian List Hasil Pencarian / Tempat Populer Sekitar Posisi User */}
          <div className="flex-1 sm:w-72 overflow-y-auto p-2.5 space-y-1.5 bg-zinc-950">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {searchQuery ? "Hasil Pencarian:" : "Tempat Populer Sekitar Anda:"}
              </p>
              {isLoadingNearby && !searchQuery && (
                <Loader2 className="h-3 w-3 animate-spin text-red-500" />
              )}
            </div>

            {isLoadingNearby && displayList.length === 0 && !searchQuery ? (
              <div className="p-6 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                <span>Mencari toko/pasar di sekitarmu...</span>
              </div>
            ) : displayList.length > 0 ? (
              displayList.map((loc, idx) => {
                const isSelected = selectedLocation.name === loc.name;
                return (
                  <div
                    key={`${loc.name}-${idx}`}
                    onClick={() => setSelectedLocation(loc)}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg p-2.5 cursor-pointer transition-all border",
                      isSelected
                        ? "border-red-600 bg-red-950/40 text-white"
                        : "border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300"
                    )}
                  >
                    <Building2 className={cn("h-4 w-4 shrink-0 mt-0.5", isSelected ? "text-red-500" : "text-zinc-500")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate leading-tight">{loc.name}</p>
                      <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{loc.address}</p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-red-500 shrink-0 ml-1" />}
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-zinc-500">
                {searchQuery
                  ? `Tidak ada lokasi ditemukan untuk "${searchQuery}".`
                  : "Belum ada toko terdeteksi di sekitar titik ini. Gunakan kolom cari atau tombol GPS."}
              </div>
            )}
          </div>
        </div>

        {/* Footer Fixed Action (Thumb-friendly di Mobile) */}
        <div className="border-t border-zinc-800 p-3 bg-zinc-950 shrink-0 flex items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] text-zinc-500 block uppercase">Terpilih:</span>
            <p className="text-xs font-bold text-white truncate">{selectedLocation.name}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 px-3 text-xs border-zinc-800 text-zinc-400 hover:text-white"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleApplyLocation}
              className="h-9 px-4 text-xs font-bold bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-md shadow-red-600/30"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Gunakan Lokasi</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
