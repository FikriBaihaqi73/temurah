"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Tag, 
  ArrowLeft, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Briefcase, 
  GraduationCap, 
  Store, 
  ShoppingBag, 
  Home, 
  AlertCircle,
  Award,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, UserRole } from "@/features/auth";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS: { id: UserRole; title: string; desc: string; icon: React.ElementType; badgeLabel: string }[] = [
  {
    id: "Mahasiswa",
    title: "Mahasiswa / Pelajar",
    desc: "Cari makan murah, kos hemat, & diskon fotokopi/kafe",
    badgeLabel: "Hemat Pelajar",
    icon: GraduationCap,
  },
  {
    id: "Pekerja / Karyawan",
    title: "Pekerja / Karyawan",
    desc: "Pantau promo groceries bulanan & makan siang hemat",
    badgeLabel: "Smart Spender",
    icon: Briefcase,
  },
  {
    id: "Pemilik UMKM / Usaha",
    title: "Pemilik Toko / UMKM Lokal",
    desc: "Bagi promosi tokomu & pantau bahan baku pasar murah",
    badgeLabel: "Mitra Lokal",
    icon: Store,
  },
  {
    id: "Ibu Rumah Tangga",
    title: "Ibu Rumah Tangga",
    desc: "Update harga sembako, minyak, telur, sayur segar pasar",
    badgeLabel: "Ahli Pasar",
    icon: Home,
  },
  {
    id: "Pencari Diskon Umum",
    title: "Pencari Diskon Umum",
    desc: "Eksplorasi seluruh promo terbaik di sekitar tempat tinggal",
    badgeLabel: "Deal Hunter",
    icon: ShoppingBag,
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("Mahasiswa");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Semua kolom wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok. Mohon periksa kembali.");
      return;
    }

    setIsLoading(true);
    const result = await register({
      name,
      email,
      password,
      confirmPassword,
      role: selectedRole,
    });
    setIsLoading(false);

    if (result.success) {
      router.push("/");
      router.refresh();
    } else {
      setError(result.error || "Gagal mendaftarkan akun. Silakan periksa data Anda.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row">
      {/* Kolom Kiri: Showcase Manfaat Komunitas (Desktop) */}
      <div className="relative hidden lg:flex lg:w-5/12 flex-col justify-between p-12 overflow-hidden border-r border-zinc-800/80 bg-zinc-950">
        <div className="absolute top-0 left-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

        {/* Brand */}
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
                GABUNG WARGA BERBAGI
              </span>
            </div>
          </Link>
        </div>

        {/* Value Proposition Box */}
        <div className="relative z-10 max-w-sm my-auto py-6 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
              <Award className="h-3.5 w-3.5" />
              <span>Satu Akun, Dampak Kolektif</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Bantu tetangga hemat, <br />
              <span className="bg-gradient-to-r from-red-500 to-amber-400 bg-clip-text text-transparent">
                temukan promo sebelum habis.
              </span>
            </h2>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Dengan memilih peran yang tepat, kamu membantu komunitas menyajikan promo yang paling relevan untuk segmen kebutuhan harianmu.
            </p>
          </div>

          {/* Fitur Keanggotaan */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3 backdrop-blur-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              Hak Eksklusif Anggota Temurah:
            </span>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <Check className="h-3 w-3" />
                </div>
                <span className="text-zinc-300">Hak voting validasi & lapor harga kedaluwarsa</span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-red-500/20 text-red-400 shrink-0 mt-0.5">
                  <Check className="h-3 w-3" />
                </div>
                <span className="text-zinc-300">Bisa memotret label promo rak & publikasi instan</span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <Check className="h-3 w-3" />
                </div>
                <span className="text-zinc-300">Dapatkan badge Hunter dan poin reputasi lokal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[11px] text-zinc-500 flex items-center justify-between border-t border-zinc-900 pt-4">
          <span>Temurah Community &copy; 2026</span>
          <span className="font-mono text-zinc-600">INISIATIF LOKAL</span>
        </div>
      </div>

      {/* Kolom Kanan: Form Registrasi */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-14 overflow-y-auto bg-zinc-950">
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

        <div className="mx-auto w-full max-w-md my-auto py-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Daftar Anggota Komunitas
            </h1>
            <p className="text-xs text-zinc-400">
              Lengkapi data singkatmu untuk mulai memvalidasi diskon di sekitarmu
            </p>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nama Lengkap / Panggilan
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Rian Pratama"
                  required
                  className="h-10 pl-9 text-xs bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-red-500"
                />
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
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

            {/* PASSWORD 2 KALI (KATA SANDI & KONFIRMASI) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    required
                    className="h-10 pl-9 text-xs bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-red-500"
                  />
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Ulangi Kata Sandi
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi sandi"
                    required
                    className="h-10 pl-9 text-xs bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-red-500"
                  />
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                </div>
              </div>
            </div>

            {/* Selector Peran Komunitas */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-zinc-200">
                  Pilih Profil Komunitasmu <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-zinc-500">Mempengaruhi feed</span>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {ROLE_OPTIONS.map((opt) => {
                  const isSelected = selectedRole === opt.id;
                  const Icon = opt.icon;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedRole(opt.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-all",
                        isSelected
                          ? "border-red-600 bg-red-950/40 ring-1 ring-red-600/50 shadow-sm"
                          : "border-zinc-800/90 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md shrink-0 transition-colors",
                        isSelected
                          ? "bg-red-600 text-white shadow-xs"
                          : "bg-zinc-800 text-zinc-400"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={cn("text-xs font-semibold truncate", isSelected ? "text-white" : "text-zinc-200")}>
                            {opt.title}
                          </p>
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0",
                            isSelected ? "bg-red-600/30 text-red-300 border border-red-500/40" : "bg-zinc-800 text-zinc-400"
                          )}>
                            {opt.badgeLabel}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                          {opt.desc}
                        </p>
                      </div>

                      <div className="shrink-0 pl-1">
                        <div className={cn(
                          "h-4 w-4 rounded-full border flex items-center justify-center transition-colors",
                          isSelected ? "border-red-500 bg-red-600 text-white" : "border-zinc-700 bg-transparent"
                        )}>
                          {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full h-10 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 mt-4"
            >
              {isLoading ? "Menyiapkan Akun Komunitas..." : "Selesai & Gabung Temurah"}
            </Button>
          </form>

          {/* CTA MASUK JELAS DI BAWAH TOMBOL SUBMIT */}
          <div className="mt-6 pt-4 border-t border-zinc-800/90 text-center">
            <p className="text-xs text-zinc-400">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-bold text-red-500 hover:text-red-400 hover:underline inline-flex items-center gap-0.5">
                <span>Masuk di sini</span>
                <span>&rarr;</span>
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-[11px] text-zinc-600">
          Akun gratis tanpa biaya langganan selamanya.
        </div>
      </div>
    </div>
  );
}
