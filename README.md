# 🏷️ Temurah — Komunitas Berbagi Diskon & Validasi Promo Lokal

**Temurah** adalah platform komunitas warga untuk menemukan, membagikan, dan memvalidasi informasi diskon serta promo harga nyata di supermarket, minimarket, pasar tradisional, toko lokal, hingga marketplace online.

Dibangun untuk melawan manipulasi "harga coret" palsu dengan mengandalkan **validasi langsung dari warga sekitar** (crowdsourced verification) lengkap dengan bukti foto struk atau label harga.

---

## ✨ Fitur Utama

### 🛒 Katalog & Penjelajahan Promo
- **Infinite Scroll (ala Shopee):** Pemuatan promo bertahap otomatis saat menggulir ke bawah pada bagian *Promo Terbaru Masuk*.
- **Pencarian & Filter Lengkap:** Filter berdasarkan kata kunci, kategori produk, tipe toko (Supermarket, Pasar Tradisional, Minimarket, Toko Lokal, Online/Marketplace), serta lokasi & radius jarak terdekat (Auto-detect Geolocation).
- **Sorotan Komunitas:** Seksi khusus *Paling Banyak Divalidasi Warga* dan *Potongan Harga Terbesar*.

### 🤝 Validasi & Interaksi Komunitas
- **Voting Validitas Promo:** Warga dapat mengonfirmasi apakah promo masih berlaku (**Valid**) atau sudah habis/tidak sesuai (**Tidak Valid**).
- **Komentar & Diskusi:** Kolom diskusi pada setiap detail promo untuk berbagi info stok, lokasi rak, atau kondisi barang.
- **Simpan Promo (Bookmark):** Simpan daftar promo favorit ke halaman `/bookmarks`.
- **Laporkan Konten:** Tombol pelaporan (*Flag*) langsung pada kartu promo, halaman detail, dan komentar untuk melaporkan penipuan harga, spam, atau pelanggaran.

### 📝 Berbagi Temuan Diskon (`/submit`)
- **Fleksibel Toko Fisik & Online:** Mendukung input toko offline (beserta pin koordinat peta interaktif) maupun toko online/marketplace (Shopee, Tokopedia, Lazada, TikTok Shop, dll).
- **Kompresi Gambar Otomatis:** Foto bukti struk/label promo otomatis dikompresi ke format WebP di sisi klien sebelum diunggah ke **Cloudinary**.

### 🛡️ Panel Kendali Administrator (`/admin`)
- **Statistik & Grafik:** Ringkasan total pengguna, promo aktif, validasi, komentar, serta distribusi kategori & tipe toko.
- **Moderasi Laporan:** Antrean laporan warga (*Pending*, *Resolved*, *Dismissed*) dengan aksi cepat hapus promo, hapus komentar, atau blokir (*ban*) akun pelanggar.
- **Manajemen Master Data:** Kelola daftar platform online, kategori produk, dan akun pengguna.

### 🔐 Autentikasi & Persona Warga
- Sistem login/register berbasis JWT (`jose`) & `bcryptjs` dengan pilihan peran/persona komunitas (*Mahasiswa*, *Pekerja / Karyawan*, *Ibu Rumah Tangga*, *Pemilik UMKM*, *Pencari Diskon Umum*).
- Akun Administrator otomatis diarahkan ke `/admin` saat login.

### 🔍 SEO & OpenGraph
- Metadata lengkap (`src/app/layout.tsx`), `sitemap.xml`, `robots.txt`, `manifest.json`, Schema.org JSON-LD (`WebSite` & `Organization`), serta gambar OpenGraph/Twitter (`1200x630` PNG & JPEG) untuk preview tautan di WhatsApp dan media sosial.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions)
- **UI & Styling:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/) + [Prisma 7](https://www.prisma.io/) (`@prisma/adapter-pg`)
- **Validasi & Auth:** [Zod v4](https://zod.dev/), [Jose (JWT)](https://github.com/panva/jose), `bcryptjs`
- **Media Storage:** [Cloudinary](https://cloudinary.com/)
- **Testing:** Node.js Test Runner (`node:test`) + `tsx`

---

## 📁 Struktur Proyek

```text
├── prisma/
│   ├── schema/          # Skema Prisma modular (user, store, promotion, comment, validation, report, dll)
│   ├── seed.ts          # Seeder data master & akun admin (dari .env)
│   └── seed-demo.ts     # Seeder demo lengkap (52 promo, 10 user warga, komentar & validasi)
├── public/              # Aset statis, ikon, manifest.json, og-image.png/jpg
├── src/
│   ├── app/             # Next.js App Router pages, layouts, robots.ts, sitemap.ts
│   ├── components/      # Komponen UI reusable (HeaderNav, ReportModal, MapLocationModal, dll)
│   ├── features/        # Modul fitur (admin, auth, community, promo, upload)
│   ├── generated/       # Prisma Client hasil generate
│   └── lib/             # Utilitas (prisma client, formatRupiah, kompresi gambar)
└── tests/
    ├── unit/            # Unit test validasi Zod, role mapping, dan formatter
    └── e2e/             # End-to-End simulation test alur lengkap & moderasi
```

---

## 🚀 Memulai Pengembangan (Getting Started)

### 1. Instalasi Dependensi
```bash
pnpm install
```

### 2. Konfigurasi Environment (`.env`)
Salin `.env.example` menjadi `.env` dan sesuaikan nilainya:
```env
DATABASE_URL=
AUTH_SECRET=

# Cloudinary (untuk upload foto bukti promo)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Kredensial Awal Administrator (digunakan oleh prisma/seed.ts)
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_NAME=
```

### 3. Sinkronisasi Database & Seeding
```bash
# Generate Prisma Client & dorong skema ke PostgreSQL
pnpm prisma:generate
pnpm prisma:push

# Seed data master & akun admin
pnpm prisma:seed

# (Opsional) Seed 52 data promo demo, 10 user warga, komentar & validasi
pnpm prisma:seed:demo
```

### 4. Jalankan Server Development
```bash
pnpm dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🧪 Pengujian (Testing)

Proyek ini dilengkapi dengan **Unit Test** dan **End-to-End (E2E) Simulation Test**:

```bash
# Menjalankan seluruh test (Unit + E2E)
pnpm test

# Menjalankan Unit Test saja
pnpm test:unit

# Menjalankan E2E Test saja
pnpm test:e2e
```

---

## 📦 Build Produksi

```bash
pnpm build
pnpm start
```
