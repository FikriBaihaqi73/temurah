import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";

export const metadata: Metadata = {
  title: "Temurah - Komunitas Berbagi Diskon & Promo Lokal",
  description: "Tempat warga berbagi dan memvalidasi informasi diskon harga pasar dan supermarket terdekat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
