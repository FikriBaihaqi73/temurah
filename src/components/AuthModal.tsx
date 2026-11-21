"use client";

import { useRouter } from "next/navigation";
import { X, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function AuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, closeAuthModal, authModalReason } = useAuth();

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={closeAuthModal}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-150">
        <button
          onClick={closeAuthModal}
          className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-3 border border-red-100 dark:border-red-900">
            <Lock className="h-5 w-5" />
          </div>

          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Masuk ke Temurah
          </h3>

          <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {authModalReason}
          </p>

          <div className="mt-4 w-full rounded border border-zinc-100 bg-zinc-50 p-2 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Akses Penuh Komunitas:</span>
            </div>
            <ul className="list-disc list-inside text-zinc-500 pl-1 space-y-0.5">
              <li>Konfirmasi keaslian harga & promo</li>
              <li>Unggah temuan diskon baru</li>
              <li>Kirim komentar pembaruan stok</li>
            </ul>
          </div>

          {/* Tombol Masuk */}
          <div className="mt-5 w-full space-y-2">
            <Button
              variant="primary"
              className="w-full text-xs font-semibold py-2"
              onClick={() => {
                closeAuthModal();
                router.push("/login");
              }}
            >
              Masuk ke Akun
            </Button>

            <Button
              variant="outline"
              className="w-full text-xs"
              onClick={closeAuthModal}
            >
              Nanti Saja (Hanya Lihat-Lihat)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
