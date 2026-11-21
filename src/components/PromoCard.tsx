"use client";

import { useState } from "react";
import { 
  Check, 
  X,
  MessageSquare, 
  MapPin, 
  Bookmark
} from "lucide-react";
import { PromoPost } from "@/lib/mock-data";
import { formatRupiah, cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { toggleValidationAction, toggleBookmarkAction } from "@/actions/community";

interface PromoCardProps {
  promo: PromoPost;
  onSelect?: (promo: PromoPost) => void;
}

export function PromoCard({ promo, onSelect }: PromoCardProps) {
  const { requireAuth } = useAuth();
  
  // Status voting user & bookmark
  const [userVote, setUserVote] = useState<"valid" | "invalid" | null>(promo.userVote ?? null);
  const [validCount, setValidCount] = useState(promo.confirmedCount);
  const [invalidCount, setInvalidCount] = useState(promo.expiredReportsCount || 0);
  const [saved, setSaved] = useState(promo.isBookmarked ?? false);
  const [prevPromoId, setPrevPromoId] = useState(promo.id);
  const [isVoting, setIsVoting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (promo.id !== prevPromoId) {
    setPrevPromoId(promo.id);
    setUserVote(promo.userVote ?? null);
    setValidCount(promo.confirmedCount);
    setInvalidCount(promo.expiredReportsCount || 0);
    setSaved(promo.isBookmarked ?? false);
  }

  // Toggle Valid
  const toggleValid = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVoting) return;
    requireAuth(async () => {
      setIsVoting(true);
      const prevVote = userVote;
      const prevValid = validCount;
      const prevInvalid = invalidCount;

      if (userVote === "valid") {
        setUserVote(null);
        setValidCount((c) => Math.max(0, c - 1));
      } else {
        if (userVote === "invalid") {
          setInvalidCount((c) => Math.max(0, c - 1));
        }
        setUserVote("valid");
        setValidCount((c) => c + 1);
      }

      try {
        const res = await toggleValidationAction({
          promotionId: promo.id,
          validationType: "VALID",
        });
        if (res.success) {
          setUserVote(res.data.userVote);
          setValidCount(res.data.validCount);
          setInvalidCount(res.data.invalidCount);
        } else {
          setUserVote(prevVote);
          setValidCount(prevValid);
          setInvalidCount(prevInvalid);
        }
      } catch (err) {
        console.error("Gagal mengirim validasi:", err);
        setUserVote(prevVote);
        setValidCount(prevValid);
        setInvalidCount(prevInvalid);
      } finally {
        setIsVoting(false);
      }
    }, "Masuk untuk memverifikasi keakuratan promo ini.");
  };

  // Toggle Tidak Valid
  const toggleInvalid = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVoting) return;
    requireAuth(async () => {
      setIsVoting(true);
      const prevVote = userVote;
      const prevValid = validCount;
      const prevInvalid = invalidCount;

      if (userVote === "invalid") {
        setUserVote(null);
        setInvalidCount((c) => Math.max(0, c - 1));
      } else {
        if (userVote === "valid") {
          setValidCount((c) => Math.max(0, c - 1));
        }
        setUserVote("invalid");
        setInvalidCount((c) => c + 1);
      }

      try {
        const res = await toggleValidationAction({
          promotionId: promo.id,
          validationType: "INVALID",
        });
        if (res.success) {
          setUserVote(res.data.userVote);
          setValidCount(res.data.validCount);
          setInvalidCount(res.data.invalidCount);
        } else {
          setUserVote(prevVote);
          setValidCount(prevValid);
          setInvalidCount(prevInvalid);
        }
      } catch (err) {
        console.error("Gagal melaporkan ketidakvalidan promo:", err);
        setUserVote(prevVote);
        setValidCount(prevValid);
        setInvalidCount(prevInvalid);
      } finally {
        setIsVoting(false);
      }
    }, "Masuk untuk melaporkan promo yang tidak valid / tidak sesuai.");
  };

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaving) return;
    requireAuth(async () => {
      setIsSaving(true);
      const prevSaved = saved;
      setSaved(!prevSaved);

      try {
        const res = await toggleBookmarkAction({
          promotionId: promo.id,
        });
        if (res.success) {
          setSaved(res.data.isBookmarked);
        } else {
          setSaved(prevSaved);
        }
      } catch (err) {
        console.error("Gagal memperbarui bookmark:", err);
        setSaved(prevSaved);
      } finally {
        setIsSaving(false);
      }
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

          {/* DUA TOMBOL VALIDASI: "Valid" & "Tidak Valid" */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* Tombol Valid */}
            <button
              type="button"
              onClick={toggleValid}
              className={cn(
                "flex items-center justify-center gap-1 rounded border py-1 px-1 text-[10px] font-medium transition-colors",
                userVote === "valid"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold dark:border-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-300 ring-1 ring-emerald-500/40"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              )}
              title="Konfirmasi harga masih sesuai & berlaku"
            >
              <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
              <span>Valid ({validCount})</span>
            </button>

            {/* Tombol Tidak Valid */}
            <button
              type="button"
              onClick={toggleInvalid}
              className={cn(
                "flex items-center justify-center gap-1 rounded border py-1 px-1 text-[10px] font-medium transition-colors",
                userVote === "invalid"
                  ? "border-red-600 bg-red-50 text-red-800 font-bold dark:border-red-600 dark:bg-red-950/70 dark:text-red-300 ring-1 ring-red-500/40"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              )}
              title="Lapor harga tidak sesuai, habis, atau bohong"
            >
              <X className="h-2.5 w-2.5 text-red-600 dark:text-red-400" />
              <span>Tidak Valid ({invalidCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
