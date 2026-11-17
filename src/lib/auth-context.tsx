"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type User = {
  id: string;
  name: string;
  avatar: string;
  badge: string;
};

interface AuthContextType {
  user: User | null;
  isAuthModalOpen: boolean;
  authModalReason: string;
  login: () => void;
  logout: () => void;
  openAuthModal: (reason?: string) => void;
  closeAuthModal: () => void;
  requireAuth: (action: () => void, reason?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Simulasi status login (default: null / belum login)
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState("Masuk untuk melanjutkan.");

  const login = () => {
    setUser({
      id: "u-1",
      name: "Budi Pratama",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      badge: "Warga Aktif",
    });
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
  };

  const openAuthModal = (reason = "Masuk untuk melanjutkan.") => {
    setAuthModalReason(reason);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Helper fungsi pelindung aksi interaktif
  const requireAuth = (action: () => void, reason = "Masuk untuk melakukan aksi ini.") => {
    if (!user) {
      openAuthModal(reason);
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
