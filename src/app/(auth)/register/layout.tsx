import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar Akun Komunitas Warga",
  description: "Bergabung dengan komunitas Temurah sebagai Mahasiswa, Ibu Rumah Tangga, Pekerja, atau Pemilik UMKM untuk saling berbagi info hemat.",
  alternates: {
    canonical: "/register",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
