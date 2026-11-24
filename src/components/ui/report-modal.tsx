"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Flag, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createReportAction } from "@/features/community";
import { cn } from "@/lib/utils";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "PROMOTION" | "COMMENT";
  targetId: string;
  targetTitle: string;
  onSuccess?: () => void;
}

const PROMO_REASONS = [
  "Harga Palsu / Manipulasi Diskon",
  "Stok Habis / Toko Sudah Tutup",
  "Spam atau Promosi Penipuan",
  "Foto Bukti Buram / Bukan Struk Asli",
  "Lokasi Toko Fiktif / Salah",
  "Lainnya",
];

const COMMENT_REASONS = [
  "Kata-kata Kasar / Pelecehan / SARA",
  "Spam Link / Promosi Ilegal",
  "Informasi Menyesatkan / Bohong",
  "Lainnya",
];

export function ReportModal({
  isOpen,
  onClose,
  type,
  targetId,
  targetTitle,
  onSuccess,
}: ReportModalProps) {
  const reasons = type === "PROMOTION" ? PROMO_REASONS : COMMENT_REASONS;
  const [selectedReason, setSelectedReason] = useState(reasons[0]);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedReason(reasons[0]);
      setDescription("");
      setErrorMessage("");
      setIsSubmitted(false);
      setIsSubmitting(false);
    }
  }, [isOpen, type]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMessage("");

    if (!selectedReason) {
      setErrorMessage("Silakan pilih alasan laporan.");
      return;
    }

    setIsSubmitting(true);
    const result = await createReportAction({
      type,
      targetId,
      reason: selectedReason,
      description: description.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.success) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setDescription("");
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } else {
      setErrorMessage(result.error || "Gagal mengirimkan laporan.");
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 select-none"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={(e) => {
          e.stopPropagation();
          if (!isSubmitting) onClose();
        }}
      />

      {/* Modal Card */}
      <div 
        className="relative z-10 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-150 select-text"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          disabled={isSubmitting}
          className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 disabled:opacity-40 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Laporan Berhasil Terkirim
            </h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              Terima kasih telah membantu menjaga komunitas Temurah. Tim Administrator akan meninjau laporan ini secepatnya.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                <Flag className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {type === "PROMOTION" ? "Laporkan Postingan Promo" : "Laporkan Komentar"}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Kirimkan laporan ke Administrator jika konten ini melanggar pedoman.
                </p>
              </div>
            </div>

            {/* Target Preview */}
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 text-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">
                Konten yang Dilaporkan:
              </span>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {targetTitle}
              </p>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-600 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Pilihan Alasan */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Pilih Alasan Pelanggaran <span className="text-red-500">*</span>
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {reasons.map((r) => {
                  const isChecked = selectedReason === r;
                  return (
                    <div
                      key={r}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReason(r);
                      }}
                      className={cn(
                        "flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors",
                        isChecked
                          ? "border-red-500 bg-red-50/50 text-red-900 dark:border-red-700 dark:bg-red-950/30 dark:text-red-200 font-medium"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                      )}
                    >
                      <input
                        type="radio"
                        name={`report_reason_${type}_${targetId}`}
                        value={r}
                        checked={isChecked}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedReason(r);
                        }}
                        className="text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      <span className="flex-1 cursor-pointer">{r}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Berikan detail tambahan agar admin dapat memverifikasi dengan tepat..."
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-red-500 focus:outline-hidden resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                disabled={isSubmitting}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Flag className="h-3.5 w-3.5" />
                    <span>Kirim Laporan</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
