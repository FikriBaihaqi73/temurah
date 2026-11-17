import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DiskonHub - Komunitas Pemburu Diskon & Promo",
  description: "Tempat berbagi dan menemukan promo, voucher, dan diskon terbaik pilihan komunitas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
