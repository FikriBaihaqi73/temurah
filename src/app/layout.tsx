import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/features/auth";
import { AuthModal } from "@/features/auth";

const APP_NAME = "Temurah";
const APP_DEFAULT_TITLE = "Temurah — Komunitas Berbagi Diskon & Promo Lokal Terverifikasi";
const APP_TITLE_TEMPLATE = "%s | Temurah";
const APP_DESCRIPTION =
  "Temukan dan bagikan informasi promo diskon sembako, supermarket, minimarket, pasar tradisional, dan marketplace terdekat yang divalidasi langsung oleh komunitas warga.";

// Dapatkan base URL yang adaptif terhadap environment deployment (Vercel / Custom Domain)
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://temurah.vercel.app");

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "diskon sembako",
    "promo supermarket",
    "promo indomaret alfamart",
    "diskon minyak goreng",
    "harga sembako murah",
    "promo pasar tradisional",
    "komunitas diskon indonesia",
    "diskon terdekat",
    "temurah",
    "katalog promo belanja",
  ],
  authors: [{ name: "Komunitas Temurah", url: APP_URL }],
  creator: "Temurah Community",
  publisher: "Temurah",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: APP_URL,
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Temurah - Komunitas Berbagi Diskon & Validasi Promo Lokal Warga",
      },
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Temurah - Komunitas Berbagi Diskon & Validasi Promo Lokal Warga",
      },
      {
        url: "/temurah-logo-cropped.png",
        width: 800,
        height: 400,
        type: "image/png",
        alt: "Temurah Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
    images: ["/og-image.png"],
    creator: "@temurah_id",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/temurah-icon.webp", type: "image/webp" },
      { url: "/temurah-icon.png", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/temurah-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <head>
        {/* Structured Data (Schema.org) untuk SEO Organik & Google Knowledge Graph */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Temurah",
              url: APP_URL,
              potentialAction: {
                "@type": "SearchAction",
                target: `${APP_URL}/?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
              description: APP_DESCRIPTION,
              inLanguage: "id-ID",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Temurah",
              url: APP_URL,
              logo: `${APP_URL}/temurah-logo-cropped.png`,
              sameAs: [],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
