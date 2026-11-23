"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  MapPin, 
  Check, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  Send,
  Navigation,
  Trash2
} from "lucide-react";
import { PromoPost, PromoComment } from "@/lib/mock-data";
import { formatRupiah, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OpenStreetMapViewer } from "@/components/ui/open-street-map";
import { useAuth } from "@/features/auth";
import { deletePromotionAction } from "@/features/promo";
import {
  toggleValidationAction,
  addCommentAction,
  deleteCommentAction,
} from "@/features/community";

interface PromoDetailSheetProps {
  promo: PromoPost | null;
  onClose: () => void;
  onConfirm: (promoId: string) => void;
  onDelete?: (promoId: string) => void;
}

export function PromoDetailSheet({ promo, onClose, onConfirm, onDelete }: PromoDetailSheetProps) {
  const { user, requireAuth } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<PromoComment[]>(promo?.comments || []);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Status voting user di detail
  const [userVote, setUserVote] = useState<"valid" | "invalid" | null>(promo?.userVote ?? null);
  const [validCount, setValidCount] = useState(promo?.confirmedCount || 0);
  const [invalidCount, setInvalidCount] = useState(promo?.expiredReportsCount || 0);
  const [prevPromoId, setPrevPromoId] = useState(promo?.id);
  const [isVoting, setIsVoting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  if (promo && promo.id !== prevPromoId) {
    setPrevPromoId(promo.id);
    setComments(promo.comments || []);
    setValidCount(promo.confirmedCount);
    setInvalidCount(promo.expiredReportsCount || 0);
    setUserVote(promo.userVote ?? null);
  }

  useEffect(() => {
    if (promo) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = originalStyle;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [promo, onClose]);

  if (!promo) return null;

  const handleOpenGoogleMaps = () => {
    const encoded = encodeURIComponent(`${promo.storeName} ${promo.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank");
  };

  const handleValidVote = () => {
    if (!promo || isVoting) return;
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
        onConfirm(promo.id);
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
        console.error("Gagal memvalidasi promo:", err);
        setUserVote(prevVote);
        setValidCount(prevValid);
        setInvalidCount(prevInvalid);
      } finally {
        setIsVoting(false);
      }
    }, "Masuk untuk mengonfirmasi bahwa promo ini masih tersedia di lokasi.");
  };

  const handleInvalidVote = () => {
    if (!promo || isVoting) return;
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
    }, "Masuk untuk melaporkan promo yang tidak sesuai atau bohong.");
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || !promo || isCommenting) return;

    requireAuth(async () => {
      setIsCommenting(true);
      try {
        const res = await addCommentAction({
          promotionId: promo.id,
          content: trimmed,
        });

        if (res.success) {
          setComments((prev) => [res.data, ...prev]);
          setCommentText("");
        } else {
          alert(res.error || "Gagal menambahkan komentar.");
        }
      } catch (err) {
        console.error("Gagal menambahkan komentar:", err);
        alert("Terjadi kendala saat mengirim komentar.");
      } finally {
        setIsCommenting(false);
      }
    }, "Masuk untuk menulis komentar update stok.");
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Hapus komentar ini?")) return;
    try {
      const res = await deleteCommentAction({ commentId });
      if (res.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        alert(res.error || "Gagal menghapus komentar.");
      }
    } catch (err) {
      console.error("Gagal menghapus komentar:", err);
      alert("Terjadi kendala saat menghapus komentar.");
    }
  };

  const handleDeletePromo = async () => {
    if (!promo) return;
    if (!window.confirm("Apakah Anda yakin ingin menghapus temuan promo ini?")) {
      return;
    }
    setIsDeleting(true);
    try {
      const result = await deletePromotionAction(promo.id);
      if (result.success) {
        if (onDelete) onDelete(promo.id);
        onClose();
      } else {
        alert(result.error || "Gagal menghapus promosi.");
      }
    } catch {
      alert("Terjadi kendala saat menghapus promosi.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="relative z-10 flex h-[90vh] sm:h-full w-full sm:max-w-lg mt-auto sm:mt-0 flex-col bg-white shadow-2xl dark:bg-zinc-900 border-t sm:border-t-0 sm:border-l border-zinc-200 dark:border-zinc-800 rounded-t-2xl sm:rounded-none overflow-hidden overscroll-contain animate-in slide-in-from-bottom sm:slide-in-from-right duration-200">
        
        {/* Mobile Pull Bar */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        {/* Header Sheet */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 shrink-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-xs">
              -{promo.discountPercentage}%
            </span>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Rincian & Lokasi Promo
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {user && (user.name === promo.contributor.name || user.id === (promo.contributor as { id?: string }).id) && (
              <button
                type="button"
                onClick={handleDeletePromo}
                disabled={isDeleting}
                className="flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Hapus promo ini"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? "Menghapus..." : "Hapus"}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 text-zinc-500"
              title="Tutup (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
          
          {/* 1. Foto Bukti */}
          <div className="relative aspect-16/10 w-full overflow-hidden rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
            <img
              src={promo.imageUrl}
              alt={promo.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-2 left-2">
              <span className="bg-zinc-900/90 text-zinc-100 text-[10px] px-2 py-0.5 rounded-xs font-medium">
                {promo.storeType}
              </span>
            </div>
            <div className="absolute top-2 right-2">
              <span className="bg-emerald-600/90 text-white text-[10px] px-2 py-0.5 rounded-xs font-medium flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Bukti Foto Terlampir
              </span>
            </div>
          </div>

          {/* 2. Judul & Harga */}
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
              {promo.title}
            </h2>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-red-600 dark:text-red-500">
                {formatRupiah(promo.promoPrice)}
              </span>
              <span className="text-xs text-zinc-400 line-through">
                {formatRupiah(promo.originalPrice)}
              </span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 ml-auto">
                Hemat {formatRupiah(promo.originalPrice - promo.promoPrice)}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              <span>Batas Masa Berlaku: <strong className="text-zinc-800 dark:text-zinc-200">{promo.validUntil}</strong></span>
            </div>

            {promo.notes && (
              <div className="mt-2.5 rounded bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Catatan Kontributor: </span>
                {promo.notes}
              </div>
            )}
          </div>

          {/* 3. LOKASI DENGAN LIVE OPENSTREETMAP */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/90 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Lokasi Penemuan</span>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-red-600 shrink-0" />
                  <span>{promo.storeName}</span>
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-200/70 dark:bg-zinc-800 px-2 py-0.5 rounded">
                ~{promo.distance}
              </span>
            </div>

            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {promo.address}
            </p>

            <OpenStreetMapViewer
              lat={promo.lat || -7.7829}
              lng={promo.lng || 110.3671}
              title={promo.storeName}
              address={promo.address}
              className="h-36 sm:h-44"
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenGoogleMaps}
              className="w-full text-xs font-semibold gap-1.5 border-zinc-300 dark:border-zinc-700"
            >
              <Navigation className="h-3.5 w-3.5 text-red-600" />
              <span>Petunjuk Arah Rute Jalan</span>
            </Button>
          </div>

          {/* 4. VALIDASI KOMUNITAS: VALID VS TIDAK VALID */}
          <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Status Validasi Warga</span>
              <span className="text-[11px] text-zinc-500">
                {validCount} Cocok • {invalidCount} Tidak Sesuai
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Tombol Valid */}
              <button
                type="button"
                onClick={handleValidVote}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded border py-2 px-2 text-xs font-medium transition-colors",
                  userVote === "valid"
                    ? "border-emerald-600 bg-emerald-600 text-white font-bold shadow-xs"
                    : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                )}
              >
                <Check className="h-3.5 w-3.5" />
                <span>Valid ({validCount})</span>
              </button>

              {/* Tombol Tidak Valid */}
              <button
                type="button"
                onClick={handleInvalidVote}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded border py-2 px-2 text-xs font-medium transition-colors",
                  userVote === "invalid"
                    ? "border-red-600 bg-red-600 text-white font-bold shadow-xs"
                    : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                )}
              >
                <X className="h-3.5 w-3.5" />
                <span>Tidak Valid ({invalidCount})</span>
              </button>
            </div>
          </div>

          {/* 5. Kolom Diskusi Warga */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
                <span>Diskusi Lapangan ({comments.length})</span>
              </h4>
              <span className="text-[10px] text-zinc-400">Update stok terkini</span>
            </div>

            <form onSubmit={handleAddComment} className="flex gap-1.5">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={user ? "Tulis update stok terkini..." : "Masuk untuk menulis komentar update stok..."}
                className="flex-1 rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-red-500"
              />
              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={isCommenting}
                className="h-8 px-3 shrink-0"
              >
                <Send className="h-3 w-3" />
              </Button>
            </form>

            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="rounded border border-zinc-100 bg-zinc-50/50 p-2.5 text-xs dark:border-zinc-800/80 dark:bg-zinc-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{c.userName}</span>
                      <span className="text-[9px] bg-zinc-200 dark:bg-zinc-700 px-1 py-0.2 rounded text-zinc-600 dark:text-zinc-300">
                        {c.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-400">{c.timeAgo}</span>
                      {user && user.name === c.userName && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-zinc-400 hover:text-red-500 transition-colors p-0.5"
                          title="Hapus komentar saya"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 text-[11px] leading-relaxed">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Fixed Action */}
        <div className="border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 shrink-0 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400">Total Harga Promo</span>
            <span className="text-sm font-bold text-red-600">{formatRupiah(promo.promoPrice)}</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenGoogleMaps}
              className="text-xs gap-1"
            >
              <Navigation className="h-3 w-3 text-red-600" />
              <span>Buka Rute</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleValidVote}
              className="text-xs gap-1"
            >
              <Check className="h-3 w-3" />
              <span>{userVote === "valid" ? "Tervalidasi" : "Valid"}</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
