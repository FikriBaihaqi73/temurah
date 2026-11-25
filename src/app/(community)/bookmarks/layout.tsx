import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar Promo Disimpan",
  description: "Daftar promo dan diskon sembako favorit yang Anda simpan untuk belanja hemat.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BookmarksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
