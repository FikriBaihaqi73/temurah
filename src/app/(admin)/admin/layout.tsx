import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel Admin & Pusat Kendali",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
