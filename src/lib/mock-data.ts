export type PromoComment = {
  id: string;
  userName: string;
  userAvatar: string;
  badge: string;
  content: string;
  timeAgo: string;
  isVerifiedBuyer?: boolean;
};

export type PromoPost = {
  id: string;
  title: string;
  category: string;
  storeName: string;
  storeType: "Supermarket" | "Pasar Tradisional" | "Minimarket" | "Online / Marketplace" | "Toko Lokal";
  location: string;
  address: string;
  googleMapsQuery: string; // Query pencarian saat klik buka maps
  distance: string;
  originalPrice: number;
  promoPrice: number;
  discountPercentage: number;
  validUntil: string;
  notes: string; // Catatan tambahan bukti promo (misal: syarat beli 2, pakai QRIS, dll)
  imageUrl: string;
  contributor: {
    name: string;
    avatar: string;
    badge: string;
  };
  confirmedCount: number;
  expiredReportsCount: number;
  commentsCount: number;
  comments?: PromoComment[];
  isHot?: boolean;
};

export const MOCK_PROMO_POSTS: PromoPost[] = [
  {
    id: "promo-1",
    title: "Minyak Goreng Sania Pouch 2L Hemat Mingguan",
    category: "Kebutuhan Pokok",
    storeName: "Superindo Kaliurang",
    storeType: "Supermarket",
    location: "Jl. Kaliurang KM 6, Sleman",
    address: "Jl. Kaliurang KM 6.2 No. 18, Manggung, Caturtunggal, Sleman, D.I. Yogyakarta 55281",
    googleMapsQuery: "Superindo Kaliurang Yogyakarta",
    distance: "1.2 km",
    originalPrice: 38900,
    promoPrice: 28500,
    discountPercentage: 27,
    validUntil: "Besok, 23:59",
    notes: "Maksimal pembelian 2 pouch per struk member. Stok di lorong tengah masih 2 kardus tadi jam 09.00.",
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=700&auto=format&fit=crop&q=80",
    contributor: {
      name: "Budi Santoso",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      badge: "Top Hunter 🏅",
    },
    confirmedCount: 38,
    expiredReportsCount: 1,
    commentsCount: 3,
    comments: [
      {
        id: "c-1",
        userName: "Agus Pratama",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
        badge: "Warga Lokal",
        content: "Baru saja lewat jam 10.30 masih dapat 2 pouch, antrean kasir 3 orang.",
        timeAgo: "25 menit lalu",
        isVerifiedBuyer: true,
      },
      {
        id: "c-2",
        userName: "Dewi Lestari",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
        badge: "Ibu Cermat",
        content: "Ada promo telur juga di sebelah rak minyaknya!",
        timeAgo: "1 jam lalu",
      },
    ],
    isHot: true,
  },
  {
    id: "promo-2",
    title: "Cabai Rawit Merah Segar (Harga Petani Langsung)",
    category: "Sayur & Bumbu",
    storeName: "Pasar Kranggan (Kios Bu Siti)",
    storeType: "Pasar Tradisional",
    location: "Kranggan, Jetis, Kota Yogyakarta",
    address: "Lantai 1 Blok B2 No. 14 Pasar Kranggan, Jl. Poncowinatan, Gowongan, Jetis, Yogyakarta",
    googleMapsQuery: "Pasar Kranggan Yogyakarta",
    distance: "2.5 km",
    originalPrice: 75000,
    promoPrice: 48000,
    discountPercentage: 36,
    validUntil: "Hari ini s/d 12:00",
    notes: "Kondisi cabai masih segar dan tangkai hijau. Datang sebelum jam 11 siang karena cepat habis.",
    imageUrl: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=700&auto=format&fit=crop&q=80",
    contributor: {
      name: "Siti Rahma",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      badge: "Warga Lokal 🌟",
    },
    confirmedCount: 24,
    expiredReportsCount: 0,
    commentsCount: 2,
    comments: [
      {
        id: "c-3",
        userName: "Mbak Yanti",
        userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
        badge: "Langganan Pasar",
        content: "Beneran segar cabainya, saya baru beli 1/2 kg tadi.",
        timeAgo: "40 menit lalu",
        isVerifiedBuyer: true,
      },
    ],
    isHot: true,
  },
  {
    id: "promo-3",
    title: "Susu UHT Ultra Milk 1000ml Full Cream",
    category: "Minuman & Susu",
    storeName: "Indomaret Point Colombo",
    storeType: "Minimarket",
    location: "Jl. Colombo No. 3, Sleman",
    address: "Jl. Colombo No. 3, Caturtunggal, Depok, Sleman (Dekat UNY)",
    googleMapsQuery: "Indomaret Point Colombo Yogyakarta",
    distance: "800 m",
    originalPrice: 21500,
    promoPrice: 16900,
    discountPercentage: 21,
    validUntil: "3 Hari lagi",
    notes: "Beli 2 lebih hemat potongan langsung di kasir.",
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=700&auto=format&fit=crop&q=80",
    contributor: {
      name: "Dimas Anggara",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
      badge: "Hunter Aktif",
    },
    confirmedCount: 15,
    expiredReportsCount: 0,
    commentsCount: 1,
    comments: [],
  },
  {
    id: "promo-4",
    title: "Deterjen Cair Rinso Matic Konsentrat 1.5kg",
    category: "Pembersih Rumah",
    storeName: "Mirota Kampus Babarsari",
    storeType: "Supermarket",
    location: "Babarsari, Depok, Sleman",
    address: "Jl. Raya Babarsari No. 10, Caturtunggal, Depok, Sleman",
    googleMapsQuery: "Mirota Kampus Babarsari",
    distance: "3.1 km",
    originalPrice: 44000,
    promoPrice: 29900,
    discountPercentage: 32,
    validUntil: "5 Hari lagi",
    notes: "Potongan harga label kuning khusus varian Front Load & Top Load.",
    imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=700&auto=format&fit=crop&q=80",
    contributor: {
      name: "Rina Kusuma",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
      badge: "Ibu Cermat 👑",
    },
    confirmedCount: 42,
    expiredReportsCount: 0,
    commentsCount: 4,
    comments: [],
    isHot: true,
  },
  {
    id: "promo-5",
    title: "Telur Ayam Ras Segar 1 Kg (Kondisi Bersih)",
    category: "Kebutuhan Pokok",
    storeName: "Toko Sembako Berkah Lancar",
    storeType: "Toko Lokal",
    location: "Jl. Affandi Gejayan No. 12",
    address: "Jl. Affandi No. 12, Santren, Caturtunggal, Sleman",
    googleMapsQuery: "Jl Affandi Gejayan No 12 Sleman",
    distance: "1.5 km",
    originalPrice: 31000,
    promoPrice: 25000,
    discountPercentage: 19,
    validUntil: "Stok Terbatas",
    notes: "Bisa pilih sendiri dan ditimbang langsung di depan pembeli.",
    imageUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=700&auto=format&fit=crop&q=80",
    contributor: {
      name: "Eko Prasetyo",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      badge: "Kontributor Baru",
    },
    confirmedCount: 19,
    expiredReportsCount: 0,
    commentsCount: 2,
    comments: [],
  },
  {
    id: "promo-6",
    title: "Beras Rojolele Delanggu 5Kg Pulen Asli",
    category: "Kebutuhan Pokok",
    storeName: "Pasar Colombo (Los Beras B4)",
    storeType: "Pasar Tradisional",
    location: "Jl. Kaliurang KM 7",
    address: "Pasar Colombo Los B4, Jl. Kaliurang KM 7.2, Condongcatur, Sleman",
    googleMapsQuery: "Pasar Colombo Sleman",
    distance: "1.8 km",
    originalPrice: 78000,
    promoPrice: 66000,
    discountPercentage: 15,
    validUntil: "Minggu ini",
    notes: "Beras panen baru Delanggu, putih alami tanpa pemutih sintetis.",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop&q=80",
    contributor: {
      name: "Arif Hidayat",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      badge: "Hunter Hemat",
    },
    confirmedCount: 31,
    expiredReportsCount: 1,
    commentsCount: 2,
    comments: [],
  },
];
