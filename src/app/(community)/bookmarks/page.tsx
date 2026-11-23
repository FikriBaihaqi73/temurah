"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, SlidersHorizontal, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth";
import { getUserBookmarksAction } from "@/features/community/actions";
import { PromoCard, PromoDetailSheet } from "@/features/promo";
import type { PromoPost } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function BookmarksPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<PromoPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDetailPromo, setActiveDetailPromo] = useState<PromoPost | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadBookmarks() {
      try {
        const res = await getUserBookmarksAction();
        if (isMounted) {
          if (res.success && res.data) {
            setBookmarks(res.data);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Gagal memuat bookmark:", err);
        if (isMounted) setIsLoading(false);
      }
    }

    if (!isAuthLoading) {
      if (user) {
        loadBookmarks();
      } else {
        setIsLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [user, isAuthLoading]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-16">
      {/* Top Navbar */}
      <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 px-3 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Bookmark className="h-4 w-4 text-red-600 fill-red-600" />
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {bookmarks.length} Disimpan
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-3 sm:px-6 pt-5 space-y-5">
        {/* Header Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 dark:text-red-400">
            <Bookmark className="h-3 w-3" />
            <span>Promo Tersimpan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Daftar Diskon Incaran Saya
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Simpan promo favorit Anda untuk dipantau dan dibelanjakan saat berkunjung ke toko.
          </p>
        </div>

        {/* Content State */}
        {isAuthLoading || isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            <p className="text-xs text-zinc-500">Memuat koleksi promo tersimpan...</p>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/50 p-6">
            <Bookmark className="h-10 w-10 text-zinc-400 dark:text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              Silakan Masuk Terlebih Dahulu
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
              Masuk atau buat akun warga untuk melihat daftar promo yang telah Anda tandai.
            </p>
            <Link href="/" className="mt-4">
              <Button size="sm" variant="primary" className="cursor-pointer text-xs font-semibold">
                Kembali ke Beranda & Masuk
              </Button>
            </Link>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/50 p-6">
            <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-3">
              <Bookmark className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              Belum Ada Promo yang Disimpan
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
              Tekan ikon bookmark pada kartu promo mana pun di katalog warga untuk menyimpannya di sini.
            </p>
            <Link href="/" className="mt-4">
              <Button size="sm" variant="primary" className="cursor-pointer text-xs font-semibold">
                Jelajahi Promo Warga
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
            {bookmarks.map((promo) => (
              <PromoCard
                key={promo.id}
                promo={promo}
                onSelect={(p) => setActiveDetailPromo(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Sheet Detail Promo */}
      <PromoDetailSheet
        promo={activeDetailPromo}
        onClose={() => setActiveDetailPromo(null)}
        onConfirm={(id) => {
          console.log("Confirmed deal:", id);
        }}
        onDelete={(id) => {
          setBookmarks((prev) => prev.filter((p) => p.id !== id));
          setActiveDetailPromo(null);
        }}
      />
    </div>
  );
}
