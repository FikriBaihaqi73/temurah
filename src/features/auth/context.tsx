"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  loginAction,
  registerAction,
  logoutAction,
  getCurrentUserAction,
  updateProfileAction,
  type SafeUser,
} from "@/features/auth/actions";
import type { UserRole, UpdateProfileInput } from "@/features/auth/validations";

export type { UserRole };

export type User = SafeUser;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalReason: string;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<{ success: boolean; error?: string }>;
  openAuthModal: (reason?: string) => void;
  closeAuthModal: () => void;
  requireAuth: (action: () => void, reason?: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState("Masuk untuk melanjutkan.");
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUserAction();
      setUser(currentUser);
    } catch (err) {
      console.error("[refreshUser error]:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initSession() {
      try {
        const currentUser = await getCurrentUserAction();
        if (!ignore) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error("[initSession error]:", err);
        if (!ignore) {
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    initSession();
    return () => {
      ignore = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await loginAction({ email, password });
      if (result.success) {
        setUser(result.user);
        setIsAuthModalOpen(false);
        return { success: true, user: result.user };
      }
      return { success: false, error: result.error };
    } catch (err) {
      console.error("[login error]:", err);
      return { success: false, error: "Gagal masuk ke akun. Silakan coba lagi." };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
  }) => {
    setIsLoading(true);
    try {
      const result = await registerAction(data);
      if (result.success) {
        setUser(result.user);
        setIsAuthModalOpen(false);
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (err) {
      console.error("[register error]:", err);
      return { success: false, error: "Gagal mendaftarkan akun. Silakan coba lagi." };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutAction();
      setUser(null);
      router.refresh();
    } catch (err) {
      console.error("[logout error]:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: UpdateProfileInput) => {
    setIsLoading(true);
    try {
      const result = await updateProfileAction(data);
      if (result.success) {
        setUser(result.user);
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (err) {
      console.error("[updateProfile error]:", err);
      return { success: false, error: "Gagal memperbarui profil." };
    } finally {
      setIsLoading(false);
    }
  };

  const openAuthModal = (reason = "Masuk untuk melanjutkan.") => {
    setAuthModalReason(reason);
    router.push(`/login?reason=${encodeURIComponent(reason)}`);
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
        isLoading,
        isAuthModalOpen,
        authModalReason,
        login,
        register,
        logout,
        updateProfile,
        openAuthModal,
        closeAuthModal,
        requireAuth,
        refreshUser,
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
