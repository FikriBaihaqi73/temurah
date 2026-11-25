import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk ke Akun Warga",
  description: "Masuk ke akun Temurah Anda untuk berbagi diskon, memvalidasi promo, dan berkomentar bersama warga lainnya.",
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
