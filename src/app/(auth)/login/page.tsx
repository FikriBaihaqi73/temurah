"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Tag, 
  ArrowLeft, 
  Mail, 
  Lock, 
  AlertCircle, 
  Sparkles,
  Flame,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Silakan lengkapi email dan kata sandi.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      login(email, password);
      setIsLoading(false);
      router.push("/");
    }, 350);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row">
      {/* Kolom Kiri: Showcase Visual Eksklusif (Desktop) */}
      <div className="relative hidden lg:flex lg:w-7/12 flex-col justify-between p-12 overflow-hidden border-r border-zinc-800/80 bg-zinc-950">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white font-bold text-sm shadow-md shadow-red-600/30">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white block leading-none">
                Temurah<span className="text-red-500">.</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono tracking-wide">
                KOMUNITAS DISKON LOKAL
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-400 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>840+ Promo Terverifikasi Hari Ini</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 max-w-xl my-auto py-8 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Platform Kurasi Harga Nyata #1</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Belanja cerdas mulai dari <br />
              <span className="bg-gradient-to-r from-red-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                harga jujur warga sekitarmu.
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md">
              Temukan label promo supermarket dan pasar tradisional sebelum kamu melangkah keluar rumah. Divalidasi bersama dengan bukti foto aktual.
            </p>
          </div>

          {/* Interactive Floating Card Mockup */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 backdrop-blur-xl shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                Live Feed Terverifikasi
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                Aktif di Area Sleman & Jogja
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-950/70 border border-zinc-800/80 p-2.5 flex items-center gap-2.5">
                <img
                  src="https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100&auto=format&fit=crop&q=80"
                  alt="Minyak"
                  className="h-10 w-10 rounded object-cover border border-zinc-800 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">Minyak Goreng 2L</p>
                  <p className="text-xs font-bold text-red-500">Rp 28.500 <span className="text-[10px] text-zinc-500 line-through">38k</span></p>
                  <p className="text-[9px] text-zinc-400 truncate">Superindo • 38 Validasi</p>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-950/70 border border-zinc-800/80 p-2.5 flex items-center gap-2.5">
                <img
                  src="https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=100&auto=format&fit=crop&q=80"
                  alt="Cabai"
                  className="h-10 w-10 rounded object-cover border border-zinc-800 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">Cabai Rawit Merah</p>
                  <p className="text-xs font-bold text-red-500">Rp 48.000 <span className="text-[10px] text-zinc-500 line-through">75k</span></p>
                  <p className="text-[9px] text-zinc-400 truncate">Pasar Kranggan • 24 Valid</p>
                </div>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-2.5 text-[11px] text-zinc-400">
              <div className="flex -space-x-1.5 shrink-0">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=80" className="h-5 w-5 rounded-full border border-zinc-900 object-cover" alt="User 1" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=80" className="h-5 w-5 rounded-full border border-zinc-900 object-cover" alt="User 2" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&auto=format&fit=crop&q=80" className="h-5 w-5 rounded-full border border-zinc-900 object-cover" alt="User 3" />
              </div>
              <span>Bergabung bersama <strong>3.400+ warga</strong> pencari diskon aktif.</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-zinc-500 flex items-center justify-between border-t border-zinc-900 pt-4">
          <span>Temurah Ecosystem &copy; 2026</span>
          <span className="font-mono">BUILD FOR IMPACT</span>
        </div>
      </div>

      {/* Kolom Kanan: Form Login */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 bg-zinc-950">
        {/* Tombol Kembali Saja di Atas */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="lg:hidden flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-red-600 text-white font-bold text-[10px]">
              <Tag className="h-3 w-3" />
            </div>
            <span className="text-xs font-bold text-white">Temurah</span>
          </div>
        </div>

        {/* Form Box */}
        <div className="mx-auto w-full max-w-sm my-auto py-8">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Masuk ke Akun
            </h1>
            <p className="text-xs text-zinc-400">
              Akses fitur validasi, diskusi stok, dan berbagi diskon lokal
            </p>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="h-10 pl-9 text-xs bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-red-500"
                />
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Kata Sandi
                </label>
                <a href="#" className="text-[11px] text-red-500 hover:underline">
                  Lupa kata sandi?
                </a>
              </div>
              <div className="relative">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-10 pl-9 text-xs bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-red-500"
                />
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full h-10 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
            >
              {isLoading ? "Memproses Autentikasi..." : "Masuk ke Temurah"}
            </Button>
          </form>

          {/* Quick Demo Button */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-zinc-950 px-2 text-zinc-500 tracking-wider font-semibold">
                Atau Mode Evaluasi
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              login("budi.santoso@gmail.com", "demo123");
              router.push("/");
            }}
            className="flex items-center justify-center gap-2 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Masuk 1-Click (Akun Demo Juri / Penilai)</span>
          </button>

          {/* CTA DAFTAR JELAS DI BAWAH TOMBOL AKSI */}
          <div className="mt-8 pt-5 border-t border-zinc-800/90 text-center">
            <p className="text-xs text-zinc-400">
              Belum punya akun komunitas?{" "}
              <Link href="/register" className="font-bold text-red-500 hover:text-red-400 hover:underline inline-flex items-center gap-0.5">
                <span>Daftar Sekarang</span>
                <span>&rarr;</span>
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Minimal */}
        <div className="text-center text-[11px] text-zinc-600">
          Dengan masuk, kamu menyetujui prinsip keterbukaan data komunitas Temurah.
        </div>
      </div>
    </div>
  );
}
