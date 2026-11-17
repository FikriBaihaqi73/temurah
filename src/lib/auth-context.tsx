"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "Mahasiswa" | "Pekerja / Karyawan" | "Ibu Rumah Tangga" | "Pemilik UMKM / Usaha" | "Pencari Diskon Umum";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  badge: string;
};

interface AuthContextType {
  user: User | null;
  isAuthModalOpen: boolean;
  authModalReason: string;
  login: (email?: string, password?: string) => boolean;
  register: (data: { name: string; email: string; password?: string; role: UserRole }) => boolean;
  logout: () => void;
  openAuthModal: (reason?: string) => void;
  closeAuthModal: () => void;
  requireAuth: (action: () => void, reason?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState("Masuk untuk melanjutkan.");
  const router = useRouter();

  // Muat status user dari localStorage jika ada
  useEffect(() => {
    try {
      const stored = localStorage.getItem("temurah_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const login = (email?: string, password?: string) => {
    const defaultUser: User = {
      id: "u-1",
      name: email ? email.split("@")[0] : "Budi Santoso",
      email: email || "budi@example.com",
      role: "Pekerja / Karyawan",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      badge: "Warga Aktif",
    };
    setUser(defaultUser);
    localStorage.setItem("temurah_user", JSON.stringify(defaultUser));
    setIsAuthModalOpen(false);
    return true;
  };

  const register = (data: { name: string; email: string; password?: string; role: UserRole }) => {
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      badge: `${data.role} 🌟`,
    };
    setUser(newUser);
    localStorage.setItem("temurah_user", JSON.stringify(newUser));
    setIsAuthModalOpen(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("temurah_user");
  };

  const openAuthModal = (reason = "Masuk untuk melanjutkan.") => {
    // Arahkan langsung ke halaman /login (mobile & desktop first)
    router.push("/login");
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const requireAuth = (action: () => void, reason = "Masuk untuk melakukan aksi ini.") => {
    if (!user) {
      router.push(`/login?reason=${encodeURIComponent(reason)}`);
    } else {
      action();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthModalOpen,
        authModalReason,
        login,
        register,
        logout,
        openAuthModal,
        closeAuthModal,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
