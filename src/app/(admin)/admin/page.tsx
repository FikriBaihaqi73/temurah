"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  Users, 
  Tag, 
  ShieldAlert, 
  BarChart3, 
  Globe, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Loader2, 
  Search, 
  TrendingUp, 
  Sparkles,
  ShoppingBag,
  Store,
  Ban,
  Lock,
  ExternalLink,
  Layers,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth";
import { cn } from "@/lib/utils";
import {
  getAdminStatsAction,
  getAdminUsersAction,
  toggleBanUserAction,
  getPlatformsAction,
  addPlatformAction,
  togglePlatformAction,
  deletePlatformAction,
  getAdminCategoriesAction,
  addCategoryAction,
  deleteCategoryAction,
  getStoreCategoriesAction,
  addStoreCategoryAction,
  deleteStoreCategoryAction,
  getRolesAction,
  addRoleAction,
  toggleRoleAction,
  deleteRoleAction,
  type AdminStats,
  type AdminUserItem,
  type PlatformItem,
  type CategoryItem,
  type StoreCategoryItem,
  type RoleItem,
} from "@/features/admin";

type AdminTab = 
  | "overview" 
  | "users" 
  | "online-stores" 
  | "offline-stores" 
  | "categories" 
  | "roles";

export default function AdminDashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  // State Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [platforms, setPlatforms] = useState<PlatformItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [storeCategories, setStoreCategories] = useState<StoreCategoryItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchUserQuery, setSearchUserQuery] = useState("");

  // Form Tambah Platform Online
  const [newPlatformName, setNewPlatformName] = useState("");
  const [newPlatformIcon, setNewPlatformIcon] = useState("🌐");
  const [newPlatformPlaceholder, setNewPlatformPlaceholder] = useState("");
  const [isAddingPlatform, setIsAddingPlatform] = useState(false);

  // Form Tambah Toko Offline
  const [newStoreCatName, setNewStoreCatName] = useState("");
  const [newStoreCatIcon, setNewStoreCatIcon] = useState("🏪");
  const [isAddingStoreCat, setIsAddingStoreCat] = useState(false);

  // Form Tambah Kategori Produk
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Form Tambah Role
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleBadge, setNewRoleBadge] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleIcon, setNewRoleIcon] = useState("👤");
  const [isAddingRole, setIsAddingRole] = useState(false);

  // Feedback Notification Message
  const [actionMessage, setActionMessage] = useState("");

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(""), 3500);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, platRes, catRes, storeCatRes, rolesRes] = await Promise.all([
        getAdminStatsAction(),
        getAdminUsersAction(),
        getPlatformsAction(),
        getAdminCategoriesAction(),
        getStoreCategoriesAction(),
        getRolesAction(),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (usersRes.success && usersRes.data) setUsers(usersRes.data);
      if (platRes.success) setPlatforms(platRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (storeCatRes.success) setStoreCategories(storeCatRes.data);
      if (rolesRes.success) setRoles(rolesRes.data);
    } catch (err) {
      console.error("Gagal memuat data admin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading && user?.isAdmin) {
      loadAllData();
    }
  }, [isAuthLoading, user]);

  // Guard: Jika loading auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-8 w-8 text-red-500 animate-spin mb-3" />
        <p className="text-xs text-zinc-400">Memverifikasi hak akses Administrator...</p>
      </div>
    );
  }

  // Guard: Jika BUKAN Admin atau belum login
  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Akses Ditolak (Khusus Administrator)
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Halaman ini hanya dapat diakses oleh akun dengan wewenang Administrator.
            Akun Anda saat ini <span className="font-semibold text-zinc-200">({user?.email || "Belum Masuk"})</span> adalah akun warga biasa.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/" className="inline-flex">
              <Button variant="outline" className="w-full text-xs border-zinc-700 text-zinc-300 hover:text-white">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Kembali ke Beranda
              </Button>
            </Link>
            {!user && (
              <Link href="/login" className="inline-flex">
                <Button variant="primary" className="w-full text-xs bg-red-600 hover:bg-red-700 text-white">
                  Masuk Akun Admin
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handler Banned User
  const handleToggleBan = async (u: AdminUserItem) => {
    const confirmText = u.isBanned 
      ? `Apakah Anda yakin ingin memulihkan (unban) akun ${u.name}?` 
      : `Apakah Anda yakin ingin membanned akun ${u.name}? Akun tidak akan bisa login atau membagikan promo.`;
    
    if (!window.confirm(confirmText)) return;

    const res = await toggleBanUserAction(u.id, "Pelanggaran pedoman harga & diskon komunitas");
    if (res.success) {
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, isBanned: res.isBanned ?? !item.isBanned } : item))
      );
      if (stats) {
        setStats({
          ...stats,
          bannedUsers: res.isBanned ? stats.bannedUsers + 1 : Math.max(0, stats.bannedUsers - 1),
        });
      }
      showNotification(`Status akun ${u.name} berhasil diperbarui.`);
    } else {
      alert(res.error || "Gagal mengubah status banned user.");
    }
  };

  // Handler Tambah Platform
  const handleAddPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatformName.trim()) return;

    setIsAddingPlatform(true);
    const res = await addPlatformAction({
      name: newPlatformName,
      icon: newPlatformIcon || "🌐",
      placeholder: newPlatformPlaceholder || `Contoh: https://${newPlatformName.toLowerCase()}.com/...`,
    });
    setIsAddingPlatform(false);

    if (res.success) {
      setNewPlatformName("");
      setNewPlatformPlaceholder("");
      const platRes = await getPlatformsAction();
      if (platRes.success) setPlatforms(platRes.data);
      showNotification("Platform e-commerce berhasil ditambahkan ke pilihan submit diskon.");
    } else {
      alert(res.error || "Gagal menambahkan platform.");
    }
  };

  // Handler Toggle Platform
  const handleTogglePlatform = async (id: string) => {
    const res = await togglePlatformAction(id);
    if (res.success) {
      setPlatforms((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
      );
      showNotification("Status platform berhasil diubah.");
    }
  };

  // Handler Hapus Platform
  const handleDeletePlatform = async (id: string, name: string) => {
    if (!window.confirm(`Hapus platform online "${name}" dari sistem?`)) return;
    const res = await deletePlatformAction(id);
    if (res.success) {
      setPlatforms((prev) => prev.filter((p) => p.id !== id));
      showNotification(`Platform "${name}" berhasil dihapus.`);
    }
  };

  // Handler Tambah Toko Offline
  const handleAddStoreCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreCatName.trim()) return;

    setIsAddingStoreCat(true);
    const res = await addStoreCategoryAction({
      name: newStoreCatName,
      icon: newStoreCatIcon || "🏪",
      type: "OFFLINE",
    });
    setIsAddingStoreCat(false);

    if (res.success) {
      setNewStoreCatName("");
      const storeRes = await getStoreCategoriesAction();
      if (storeRes.success) setStoreCategories(storeRes.data);
      showNotification("Kategori toko fisik berhasil ditambahkan ke pilihan submit diskon.");
    } else {
      alert(res.error || "Gagal menambahkan kategori toko fisik.");
    }
  };

  // Handler Hapus Toko Offline
  const handleDeleteStoreCategory = async (id: string, name: string) => {
    if (!window.confirm(`Hapus kategori toko fisik "${name}"?`)) return;
    const res = await deleteStoreCategoryAction(id);
    if (res.success) {
      setStoreCategories((prev) => prev.filter((c) => c.id !== id));
      showNotification(`Kategori "${name}" berhasil dihapus.`);
    }
  };

  // Handler Tambah Kategori Produk
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsAddingCategory(true);
    const res = await addCategoryAction(newCategoryName);
    setIsAddingCategory(false);

    if (res.success) {
      setNewCategoryName("");
      const catRes = await getAdminCategoriesAction();
      if (catRes.success) setCategories(catRes.data);
      showNotification("Kategori produk berhasil ditambahkan.");
    } else {
      alert(res.error || "Gagal menambah kategori produk.");
    }
  };

  // Handler Hapus Kategori Produk
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Hapus kategori produk "${name}"?`)) return;
    const res = await deleteCategoryAction(id);
    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showNotification(`Kategori "${name}" berhasil dihapus.`);
    }
  };

  // Handler Tambah Role Komunitas
  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setIsAddingRole(true);
    const res = await addRoleAction({
      name: newRoleName,
      badge: newRoleBadge || newRoleName,
      description: newRoleDesc || "Warga komunitas Temurah",
      icon: newRoleIcon || "👤",
    });
    setIsAddingRole(false);

    if (res.success) {
      setNewRoleName("");
      setNewRoleBadge("");
      setNewRoleDesc("");
      const roleRes = await getRolesAction();
      if (roleRes.success) setRoles(roleRes.data);
      showNotification("Peran/persona komunitas baru berhasil ditambahkan.");
    } else {
      alert(res.error || "Gagal menambah peran.");
    }
  };

  // Handler Toggle Role
  const handleToggleRole = async (id: string) => {
    const res = await toggleRoleAction(id);
    if (res.success) {
      setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
      showNotification("Status peran berhasil diubah.");
    }
  };

  // Handler Hapus Role
  const handleDeleteRole = async (id: string, name: string) => {
    if (!window.confirm(`Hapus peran "${name}"?`)) return;
    const res = await deleteRoleAction(id);
    if (res.success) {
      setRoles((prev) => prev.filter((r) => r.id !== id));
      showNotification(`Peran "${name}" berhasil dihapus.`);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGATION ADMIN */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
        {/* Brand & Admin Badge */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-7 w-28 shrink-0">
              <Image
                src="/temurah-logo.webp"
                alt="Temurah"
                fill
                sizes="112px"
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold">
            ADMIN
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              activeTab === "overview"
                ? "bg-red-600 text-white font-semibold shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            )}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="h-4 w-4" />
              <span>Overview & Statistik</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              activeTab === "users"
                ? "bg-red-600 text-white font-semibold shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4" />
              <span>Kelola Pengguna</span>
            </div>
            <span className={cn("text-[10px] px-1.5 py-0.2 rounded font-mono", activeTab === "users" ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400")}>
              {users.length}
            </span>
          </button>

          <div className="pt-3 pb-1 px-3">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Master Data Toko
            </p>
          </div>

          <button
            onClick={() => setActiveTab("online-stores")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              activeTab === "online-stores"
                ? "bg-red-600 text-white font-semibold shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4" />
              <span>Toko Online (Marketplace)</span>
            </div>
            <span className={cn("text-[10px] px-1.5 py-0.2 rounded font-mono", activeTab === "online-stores" ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400")}>
              {platforms.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("offline-stores")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              activeTab === "offline-stores"
                ? "bg-red-600 text-white font-semibold shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Store className="h-4 w-4" />
              <span>Toko Offline (Kategori Fisik)</span>
            </div>
            <span className={cn("text-[10px] px-1.5 py-0.2 rounded font-mono", activeTab === "offline-stores" ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400")}>
              {storeCategories.length}
            </span>
          </button>

          <div className="pt-3 pb-1 px-3">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Data Sistem & Komunitas
            </p>
          </div>

          <button
            onClick={() => setActiveTab("categories")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              activeTab === "categories"
                ? "bg-red-600 text-white font-semibold shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Tag className="h-4 w-4" />
              <span>Kategori Produk Diskon</span>
            </div>
            <span className={cn("text-[10px] px-1.5 py-0.2 rounded font-mono", activeTab === "categories" ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400")}>
              {categories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("roles")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              activeTab === "roles"
                ? "bg-red-600 text-white font-semibold shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4" />
              <span>Peran Komunitas (Register)</span>
            </div>
            <span className={cn("text-[10px] px-1.5 py-0.2 rounded font-mono", activeTab === "roles" ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400")}>
              {roles.length}
            </span>
          </button>
        </nav>

        {/* Footer Sidebar: User Profile & Back to App */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/40 space-y-2">
          <div className="flex items-center gap-2 px-1">
            <div className="h-7 w-7 rounded-full bg-red-600/30 border border-red-500 flex items-center justify-center text-xs font-bold text-white">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Web Temurah</span>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-zinc-950 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Link href="/" className="hover:text-white">Temurah</Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
            <span className="text-zinc-200 font-medium capitalize">
              {activeTab === "overview" && "Overview & Analisis"}
              {activeTab === "users" && "Kelola Pengguna Komunitas"}
              {activeTab === "online-stores" && "Master Data Toko Online (Marketplace)"}
              {activeTab === "offline-stores" && "Master Data Toko Offline (Kategori Fisik)"}
              {activeTab === "categories" && "Master Kategori Produk Diskon"}
              {activeTab === "roles" && "Master Peran Komunitas (Pilihan Register)"}
            </span>
          </div>

          <button
            onClick={loadAllData}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin text-red-500")} />
            <span>Segarkan</span>
          </button>
        </header>

        {/* Feedback Alert Bar */}
        {actionMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        <div className="p-6 space-y-6 max-w-7xl">
          {/* TAB 1: OVERVIEW & STATISTIK */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Diskon Aktif</span>
                    <ShoppingBag className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-white tracking-tight">
                    {stats?.activePromotions ?? 0}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Dari total {stats?.totalPromotions ?? 0} promo masuk
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Total Pengguna</span>
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-white tracking-tight">
                    {stats?.totalUsers ?? 0}
                  </p>
                  <p className="text-[10px] text-zinc-500">Warga terdaftar di Temurah</p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Akun Diblokir (Banned)</span>
                    <Ban className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-500 tracking-tight">
                    {stats?.bannedUsers ?? 0}
                  </p>
                  <p className="text-[10px] text-zinc-500">Pelanggaran harga / spam</p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Total Validasi Warga</span>
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-amber-400 tracking-tight">
                    {stats?.totalValidations ?? 0}
                  </p>
                  <p className="text-[10px] text-zinc-500">Vote benar & stok valid</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Tren Posting Promo */}
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-red-500" />
                        Tren Postingan Promo (7 Hari Terakhir)
                      </h3>
                      <p className="text-[11px] text-zinc-400">Jumlah info diskon baru yang dibagikan warga</p>
                    </div>
                  </div>

                  <div className="pt-4 flex items-end gap-2 h-44 border-b border-zinc-800 pb-2">
                    {stats?.postingsChart?.map((item, idx) => {
                      const max = Math.max(...(stats?.postingsChart?.map((x) => x.count) || [1]), 1);
                      const heightPercent = Math.max((item.count / max) * 100, 10);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                          <span className="text-[10px] font-mono font-bold text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.count}
                          </span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full bg-red-600/80 hover:bg-red-500 rounded-t-md transition-all shadow-sm shadow-red-900/40"
                          />
                          <span className="text-[9px] text-zinc-500 font-mono truncate w-full text-center">
                            {item.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart 2: Pertumbuhan User */}
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        Pendaftaran Pengguna Baru (7 Hari Terakhir)
                      </h3>
                      <p className="text-[11px] text-zinc-400">Pertumbuhan warga pencari & pembagi diskon</p>
                    </div>
                  </div>

                  <div className="pt-4 flex items-end gap-2 h-44 border-b border-zinc-800 pb-2">
                    {stats?.userGrowthChart?.map((item, idx) => {
                      const max = Math.max(...(stats?.userGrowthChart?.map((x) => x.count) || [1]), 1);
                      const heightPercent = Math.max((item.count / max) * 100, 10);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                          <span className="text-[10px] font-mono font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.count}
                          </span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full bg-blue-600/80 hover:bg-blue-500 rounded-t-md transition-all shadow-sm shadow-blue-900/40"
                          />
                          <span className="text-[9px] text-zinc-500 font-mono truncate w-full text-center">
                            {item.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KELOLA PENGGUNA */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">Manajemen Akun Pengguna</h2>
                  <p className="text-xs text-zinc-400">
                    Pantau aktivitas warga dan lakukan tindakan pemblokiran (banned) jika terdeteksi spam atau manipulasi harga.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Input
                    type="text"
                    placeholder="Cari nama atau email..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="h-9 pl-8 text-xs bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                  />
                  <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Pengguna</th>
                        <th className="py-3 px-4 font-semibold">Persona / Role</th>
                        <th className="py-3 px-4 font-semibold">Status Akun</th>
                        <th className="py-3 px-4 font-semibold text-center">Promo Dibagikan</th>
                        <th className="py-3 px-4 font-semibold">Bergabung</th>
                        <th className="py-3 px-4 font-semibold text-right">Tindakan Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-500">
                            Tidak ada pengguna yang cocok dengan pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-300">
                                  {u.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-zinc-200">{u.name}</span>
                                    {u.isAdmin && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-600/20 text-red-400 border border-red-500/30 font-semibold">
                                        ADMIN
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-zinc-500">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                {u.preference.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {u.isBanned ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-950/60 border border-red-800/80 px-2 py-0.5 rounded-full">
                                  <Ban className="h-3 w-3" />
                                  Diblokir (Banned)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Aktif Normal
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-semibold text-zinc-300">
                              {u.promotionsCount}
                            </td>
                            <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                              {new Date(u.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {u.id === user.id ? (
                                <span className="text-[10px] text-zinc-500 italic">Akun Anda</span>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleBan(u)}
                                  className={cn(
                                    "h-7 text-[11px] px-2.5 font-semibold",
                                    u.isBanned
                                      ? "border-emerald-600/50 text-emerald-400 hover:bg-emerald-950/40"
                                      : "border-red-600/50 text-red-400 hover:bg-red-950/40"
                                  )}
                                >
                                  {u.isBanned ? "Pulihkan Akun" : "Blokir Akun"}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MASTER TOKO ONLINE (MARKETPLACE) */}
          {activeTab === "online-stores" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-white">Master Data Toko Online / E-Commerce</h2>
                <p className="text-xs text-zinc-400">
                  Platform e-commerce yang terdaftar di sini akan muncul sebagai opsi pilihan ketika warga memilih jenis toko <strong>&quot;Toko Online / Marketplace&quot;</strong> di form Tambah Diskon.
                </p>
              </div>

              {/* Form Tambah Platform Online */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-red-500" />
                  Tambah Platform Marketplace Baru
                </h3>
                <form onSubmit={handleAddPlatform} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-4">
                    <Input
                      type="text"
                      placeholder="Nama Platform (e.g. Astro Mart, Sayurbox)"
                      value={newPlatformName}
                      onChange={(e) => setNewPlatformName(e.target.value)}
                      required
                      className="h-9 text-xs bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      type="text"
                      placeholder="Emoji/Icon (e.g. 🚀)"
                      value={newPlatformIcon}
                      onChange={(e) => setNewPlatformIcon(e.target.value)}
                      className="h-9 text-xs bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <Input
                      type="text"
                      placeholder="Placeholder Link (e.g. https://...)"
                      value={newPlatformPlaceholder}
                      onChange={(e) => setNewPlatformPlaceholder(e.target.value)}
                      className="h-9 text-xs bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isAddingPlatform || !newPlatformName.trim()}
                      className="h-9 w-full text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isAddingPlatform ? "Menyimpan..." : "+ Tambah"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Grid Daftar Platform */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {platforms.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      "p-3.5 rounded-xl border flex items-center justify-between transition-colors",
                      p.isActive
                        ? "border-zinc-800 bg-zinc-900/60"
                        : "border-zinc-900 bg-zinc-950/60 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center text-lg shrink-0">
                        {p.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{p.placeholder}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <button
                        onClick={() => handleTogglePlatform(p.id)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors",
                          p.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                            : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                        )}
                      >
                        {p.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                      <button
                        onClick={() => handleDeletePlatform(p.id, p.name)}
                        className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 cursor-pointer transition-colors"
                        title="Hapus Platform"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MASTER TOKO OFFLINE (KATEGORI FISIK) */}
          {activeTab === "offline-stores" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-white">Master Data Toko Fisik / Offline</h2>
                <p className="text-xs text-zinc-400">
                  Jenis toko fisik ini akan muncul sebagai opsi pilihan ketika warga memilih <strong>&quot;Toko Fisik / Offline&quot;</strong> di form Tambah Diskon (misal Supermarket, Pasar Tradisional, Minimarket, dll.).
                </p>
              </div>

              {/* Form Tambah Toko Offline */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-red-500" />
                  Tambah Kategori Toko Fisik Baru
                </h3>
                <form onSubmit={handleAddStoreCategory} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-7">
                    <Input
                      type="text"
                      placeholder="Nama Jenis Toko (e.g. Toko Kelontong Grosir, Pasar Kaget)"
                      value={newStoreCatName}
                      onChange={(e) => setNewStoreCatName(e.target.value)}
                      required
                      className="h-9 text-xs bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      type="text"
                      placeholder="Emoji (e.g. 🏬)"
                      value={newStoreCatIcon}
                      onChange={(e) => setNewStoreCatIcon(e.target.value)}
                      className="h-9 text-xs bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isAddingStoreCat || !newStoreCatName.trim()}
                      className="h-9 w-full text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isAddingStoreCat ? "Menyimpan..." : "+ Tambah Jenis Toko"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Grid Daftar Toko Offline */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {storeCategories.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center text-lg shrink-0">
                        {c.icon || "🏪"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{c.name}</p>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                          TOKO FISIK
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteStoreCategory(c.id, c.name)}
                      className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 cursor-pointer transition-colors"
                      title="Hapus Kategori Toko"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: KATEGORI PRODUK DISKON */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-white">Master Data Kategori Produk Diskon</h2>
                <p className="text-xs text-zinc-400">
                  Kategori barang yang dijual (seperti Kebutuhan Pokok, Daging & Ikan, Sayur, Camilan, dll.) untuk memfilter promo di beranda.
                </p>
              </div>

              {/* Form Tambah Kategori */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-red-500" />
                  Tambah Kategori Produk Baru
                </h3>
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Nama Kategori Produk (e.g. Elektronik Rumah Tangga)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    required
                    className="h-9 text-xs bg-zinc-950 border-zinc-800 text-white max-w-md"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isAddingCategory || !newCategoryName.trim()}
                    className="h-9 text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isAddingCategory ? "Menyimpan..." : "+ Tambah"}
                  </Button>
                </form>
              </div>

              {/* Grid Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{c.name}</p>
                      <p className="text-[10px] text-zinc-500">{c.promotionsCount} promo aktif</p>
                    </div>

                    <button
                      onClick={() => handleDeleteCategory(c.id, c.name)}
                      className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 cursor-pointer transition-colors"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PERAN KOMUNITAS (ROLES / REGISTER) */}
          {activeTab === "roles" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-white">Master Data Peran Komunitas (Pilihan Registrasi)</h2>
                <p className="text-xs text-zinc-400">
                  Daftar persona yang aktif di sini akan muncul di formulir pendaftaran warga <strong>(/register)</strong> dan modal edit profil.
                </p>
              </div>

              {/* Form Tambah Peran */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-red-500" />
                  Tambah Peran / Persona Komunitas Baru
                </h3>
                <form onSubmit={handleAddRole} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-3">
                    <Input
                      type="text"
                      placeholder="Nama Peran (e.g. Guru / Dosen)"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      required
                      className="h-9 text-xs bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      type="text"
                      placeholder="Badge (e.g. Pahlawan Belajar 📚)"
                      value={newRoleBadge}
                      onChange={(e) => setNewRoleBadge(e.target.value)}
                      className="h-9 text-xs bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <Input
                      type="text"
                      placeholder="Deskripsi singkat"
                      value={newRoleDesc}
                      onChange={(e) => setNewRoleDesc(e.target.value)}
                      className="h-9 text-xs bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isAddingRole || !newRoleName.trim()}
                      className="h-9 w-full text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isAddingRole ? "Menyimpan..." : "+ Tambah"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Grid Daftar Peran */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {roles.map((r) => (
                  <div
                    key={r.id}
                    className={cn(
                      "p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-colors",
                      r.isActive ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-900 bg-zinc-950/60 opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center text-lg shrink-0">
                        {r.icon || "👤"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-white truncate">{r.name}</p>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-red-600/20 text-red-300 border border-red-500/30 shrink-0">
                            {r.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">
                          {r.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleRole(r.id)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors",
                          r.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-500"
                        )}
                      >
                        {r.isActive ? "Aktif di Register" : "Dinonaktifkan"}
                      </button>

                      <button
                        onClick={() => handleDeleteRole(r.id, r.name)}
                        className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 cursor-pointer transition-colors"
                        title="Hapus Peran"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
