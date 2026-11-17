"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";

interface OpenStreetMapViewerProps {
  lat: number;
  lng: number;
  title: string;
  address: string;
  className?: string;
}

export function OpenStreetMapViewer({
  lat,
  lng,
  title,
  address,
  className = "h-40",
}: OpenStreetMapViewerProps) {
  // Bounding box kecil di sekitar lat/lng untuk embed OpenStreetMap
  const delta = 0.005;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  const handleOpenExternal = () => {
    const encoded = encodeURIComponent(`${title} ${address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank");
  };

  return (
    <div className={`relative w-full rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 bg-zinc-900 ${className}`}>
      {/* Live OpenStreetMap iframe (Tanpa API Key, 100% Gratis & Open-source) */}
      <iframe
        title={`Peta Lokasi ${title}`}
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

      {/* Floating Header Card Lokasi */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between rounded bg-zinc-900/90 px-2.5 py-1.5 backdrop-blur-md border border-zinc-700/80 shadow-md">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <span className="text-[11px] font-bold text-white truncate">{title}</span>
        </div>
        <button
          type="button"
          onClick={handleOpenExternal}
          className="flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-red-700 transition-colors shrink-0 ml-2"
        >
          <span>Buka Rute</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </button>
      </div>

      {/* Attribution mini OSM */}
      <div className="absolute bottom-1 right-2 text-[9px] text-zinc-500 bg-zinc-900/80 px-1 rounded pointer-events-none">
        OpenStreetMap
      </div>
    </div>
  );
}
