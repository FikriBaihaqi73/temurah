import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bagi Diskon & Temuan Promo Baru",
  description:
    "Bantu warga dan tetangga berhemat dengan membagikan temuan diskon harga sembako, promo supermarket, atau pasar lokal terdekat.",
  alternates: {
    canonical: "/submit",
  },
  openGraph: {
    title: "Bagi Diskon & Temuan Promo Baru | Temurah",
    description:
      "Bantu warga berhemat dengan membagikan temuan diskon harga sembako, promo supermarket, atau pasar lokal terdekat.",
    url: "/submit",
  },
};

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
