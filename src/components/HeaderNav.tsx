"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check, Plus, Tag, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface HeaderNavProps {
  selectedLocation: string;
  onLocationChange: (loc: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const LOCATIONS = [
  { id: "Semua Area", label: "Semua Area Sekitar" },
  { id: "Sleman", label: "Sleman (Radius 5km)" },
  { id: "Kota Yogyakarta", label: "Kota Yogyakarta" },
  { id: "Bantul", label: "Bantul & Sekitarnya" },
];

export function HeaderNav({
  selectedLocation,
  onLocationChange,
  searchQuery,
  onSearchChange,
}: HeaderNavProps) {
  const { user, openAuthModal, logout } = useAuth();
  const [openLocation, setOpenLocation] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setOpenLocation(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setOpenProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Baris 1: Logo, Area, & Action */}
      <div className="mx-auto flex h-12 sm:h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded bg-red-600 text-white font-bold text-xs shadow-xs">
            <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <span className="text-sm sm:text-base font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Temurah
          </span>

          {/* Area Selector Popover */}
          <div className="relative" ref={locationRef}>
            <button
              type="button"
              onClick={() => setOpenLocation(!openLocation)}
              className="flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[11px] sm:text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600" />
              <span className="max-w-[70px] sm:max-w-none truncate font-medium">{selectedLocation}</span>
              <ChevronDown className="h-2.5 w-2.5 text-zinc-400" />
            </button>

            {openLocation && (
              <div className="absolute left-0 mt-1 w-44 sm:w-48 rounded border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 z-50">
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      onLocationChange(loc.id);
                      setOpenLocation(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs transition-colors",
                      selectedLocation === loc.id
                        ? "bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <span>{loc.label}</span>
                    {selectedLocation === loc.id && <Check className="h-3 w-3 text-red-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Header: Jika login -> Tampil "Bagi Diskon" & Avatar | Jika belum -> Tampil "Masuk" */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                variant="primary"
                size="sm"
                className="h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-xs gap-1"
                onClick={() => alert("Fitur formulir tambah diskon segera dibuka")}
              >
                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Bagi Diskon</span>
              </Button>

              {/* Profile Avatar & Dropdown Logout */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setOpenProfileMenu(!openProfileMenu)}
                  className="h-7 w-7 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 flex items-center justify-center cursor-pointer"
                  title={user.name}
                >
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                </button>

                {openProfileMenu && (
                  <div className="absolute right-0 mt-1 w-44 rounded border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 z-50">
                    <div className="px-2 py-1 text-[11px] border-b border-zinc-100 dark:border-zinc-800 mb-1">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{user.name}</p>
                      <p className="text-[10px] text-zinc-400">{user.badge}</p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setOpenProfileMenu(false);
                      }}
                      className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="h-3 w-3" />
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
    </header>
  );
}
