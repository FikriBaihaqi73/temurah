"use client";

import { useState } from "react";
import { 
  Check, 
  MessageSquare, 
  MapPin, 
  Bookmark,
  ExternalLink
} from "lucide-react";
import { PromoPost } from "@/lib/mock-data";
import { formatRupiah, cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface PromoCardProps {
  promo: PromoPost;
  onSelect?: (promo: PromoPost) => void;
}

export function PromoCard({ promo, onSelect }: PromoCardProps) {
  const { requireAuth } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [confirmCount, setConfirmCount] = useState(promo.confirmedCount);
  const [saved, setSaved] = useState(false);

  const toggleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => {
      if (confirmed) {
        setConfirmCount((c) => c - 1);
        setConfirmed(false);
      } else {
        setConfirmCount((c) => c + 1);
        setConfirmed(true);
      }
    }, "Masuk untuk memverifikasi keakuratan promo ini.");
  };

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => {
      setSaved(!saved);
    }, "Masuk untuk menyimpan promo ke daftar favorit Anda.");
  };

  return (
    <div 
      onClick={() => onSelect && onSelect(promo)}
      className="group flex h-full flex-col border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 transition-all cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-700 active:scale-[0.99]"
    >
      {/* Gambar Thumbnail (Rasio 1:1 Presisi) */}
      <div className="relative w-full aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <img
          src={promo.imageUrl}
          alt={promo.title}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-102"
          loading="lazy"
        />

        {/* Badge Diskon */}
        <div className="absolute top-1.5 left-1.5">
          <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-xs leading-none">
            -{promo.discountPercentage}%
          </span>
        </div>

        {/* Bookmark Mini */}
        <button
          type="button"
          onClick={toggleBookmark}
          className={cn(
            "absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded bg-white/90 border border-zinc-200/80 dark:bg-zinc-900/90 dark:border-zinc-700",
            saved ? "text-red-600" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
          )}
          title="Simpan"
        >
          <Bookmark className={cn("h-3 w-3", saved && "fill-current")} />
        </button>

        {/* Tipe Toko Mini */}
        <div className="absolute bottom-1.5 left-1.5">
          <span className="bg-zinc-900/80 text-zinc-100 text-[9px] px-1 py-0.5 rounded-xs">
            {promo.storeType}
          </span>
        </div>
      </div>

      {/* Konten Produk */}
      <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3">
        <div>
          {/* Toko & Jarak */}
          <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mb-1 gap-1">
            <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
              {promo.storeName}
            </span>
            <span className="flex items-center gap-0.5 shrink-0">
              <MapPin className="h-2.5 w-2.5" />
              {promo.distance}
            </span>
          </div>

          {/* Judul Produk */}
          <h3 className="line-clamp-2 h-7 sm:h-8 text-[11px] sm:text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline leading-snug">
            {promo.title}
          </h3>

          {/* Harga */}
          <div className="mt-1.5 flex flex-wrap items-baseline gap-1">
            <span className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-500">
              {formatRupiah(promo.promoPrice)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-zinc-400 line-through">
              {formatRupiah(promo.originalPrice)}
            </span>
          </div>
        </div>

        {/* Action & Konfirmasi Komunitas */}
        <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5">
            <span className="truncate max-w-[90px] sm:max-w-[120px]">
              Oleh: <strong className="font-medium text-zinc-700 dark:text-zinc-300">{promo.contributor.name}</strong>
            </span>
            <span className="flex items-center gap-0.5">
              <MessageSquare className="h-2.5 w-2.5" />
              {promo.commentsCount}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleConfirm}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded border py-1.5 sm:py-1 px-1.5 text-[10px] font-medium transition-colors",
                confirmed
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              )}
            >
              <Check className="h-2.5 w-2.5" />
              <span>{confirmed ? "Valid" : `Valid (${confirmCount})`}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelect) onSelect(promo);
              }}
              className="hidden sm:flex items-center justify-center gap-1 rounded border border-zinc-200 bg-white py-1 px-2 text-[10px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <span>Detail</span>
              <ExternalLink className="h-2.5 w-2.5 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
