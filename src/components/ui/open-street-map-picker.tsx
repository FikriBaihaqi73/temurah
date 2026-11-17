"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, Search } from "lucide-react";

interface OpenStreetMapPickerProps {
  address: string;
  onLocationSelect: (loc: { lat: number; lng: number; label: string }) => void;
  initialLat?: number;
  initialLng?: number;
}

const PRESET_PLACES = [
  { name: "Superindo Kaliurang", lat: -7.7554, lng: 110.3812 },
  { name: "Pasar Kranggan Jogja", lat: -7.7829, lng: 110.3671 },
  { name: "Pasar Colombo Sleman", lat: -7.7478, lng: 110.3834 },
  { name: "Mirota Kampus Babarsari", lat: -7.7816, lng: 110.4143 },
  { name: "Indomaret Point Colombo", lat: -7.7749, lng: 110.3871 },
];

export function OpenStreetMapPicker({
  address,
  onLocationSelect,
  initialLat = -7.7829,
  initialLng = 110.3671,
}: OpenStreetMapPickerProps) {
  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng });
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const delta = 0.005;
  const bbox = `${coords.lng - delta}%2C${coords.lat - delta}%2C${coords.lng + delta}%2C${coords.lat + delta}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`;

  const handleSelectPreset = (place: { name: string; lat: number; lng: number }) => {
    setSelectedPreset(place.name);
    setCoords({ lat: place.lat, lng: place.lng });
    onLocationSelect({ lat: place.lat, lng: place.lng, label: place.name });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] text-zinc-400">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-red-500" />
          <span>Pin Lokasi Peta (OpenStreetMap)</span>
        </span>
        <span className="text-[10px] text-emerald-400">Marker Aktif</span>
      </div>

      {/* Peta Interaktif Preview */}
      <div className="relative h-44 w-full rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950">
        <iframe
          title="OpenStreetMap Picker"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={embedUrl}
          className="w-full h-full opacity-90 contrast-105"
          loading="lazy"
        />

        {/* Info Lokasi Pin */}
        <div className="absolute bottom-2 left-2 right-2 rounded bg-zinc-900/90 px-2.5 py-1 text-[10px] text-zinc-300 backdrop-blur-md border border-zinc-700/80 flex items-center justify-between">
          <span className="truncate">
            Koordinat: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </span>
          <span className="text-zinc-500 text-[9px]">OpenStreetMap</span>
        </div>
      </div>

      {/* Pilihan Cepat Lokasi / Landmark Sekitar */}
      <div>
        <span className="text-[10px] text-zinc-400 block mb-1">Pilih Patokan Lokasi Terdekat:</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_PLACES.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className={`rounded border px-2 py-0.5 text-[10px] transition-colors ${
                selectedPreset === p.name
                  ? "border-red-500 bg-red-950/60 text-white font-medium"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
