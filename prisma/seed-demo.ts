import "dotenv/config";
import * as bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { 
  UserPreference, 
  StoreType, 
  StockCondition, 
  PromotionStatus, 
  ValidationType 
} from "../src/generated/prisma/enums";

// Kumpulan foto produk berkualitas tinggi dan stabil dari Unsplash
const PRODUCT_IMAGES: Record<string, string[]> = {
  "Kebutuhan Pokok": [
    "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=600&q=80", // Minyak / botol
    "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80", // Beras
    "https://images.unsplash.com/photo-1621996346565-e3d5d6281050?auto=format&fit=crop&w=600&q=80", // Gula / tepung
    "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=600&q=80", // Telur
    "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80", // Mie / pasta
  ],
  "Sayur & Bumbu": [
    "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80", // Wortel
    "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80", // Tomat
    "https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=600&q=80", // Cabai / bumbu
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80", // Sayuran hijau / selada
    "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80", // Kentang / bawang
  ],
  "Minuman & Susu": [
    "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80", // Susu kotak
    "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80", // Kopi botol
    "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80", // Minuman kaleng soda
    "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80", // Teh botol
  ],
  "Daging & Ikan": [
    "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80", // Daging ayam
    "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=600&q=80", // Daging sapi segar
    "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80", // Ikan salmon/segar
  ],
  "Pembersih Rumah": [
    "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80", // Sabun cuci tangan
    "https://images.unsplash.com/photo-1585670270608-b404fb080164?auto=format&fit=crop&w=600&q=80", // Sabun pencuci piring
    "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=600&q=80", // Deterjen pakaian
  ],
  "Camilan & Roti": [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80", // Roti tawar
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80", // Cookies / biskuit
    "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80", // Keripik kentang
  ],
  "Perlengkapan Bayi": [
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80", // Popok / perlengkapan bayi
    "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80", // Sabun bayi
  ],
  "Lainnya": [
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80", // Produk umum
  ],
};

function getRandomImage(categoryName: string, index: number): string {
  const list = PRODUCT_IMAGES[categoryName] || PRODUCT_IMAGES["Lainnya"];
  return list[index % list.length];
}

// 52 Item Promo Realistis Lengkap dengan Diskon & Detail Toko
const DEMO_ITEMS = [
  // 1-10: KEBUTUHAN POKOK
  {
    name: "Minyak Goreng Sania Pouch 2 Liter",
    category: "Kebutuhan Pokok",
    storeName: "Superindo Kaliurang",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Kaliurang KM 6 No. 28, Sleman, DI Yogyakarta",
    normalPrice: 38500,
    discountPrice: 28900,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Promo mingguan Super Hemat JSM. Maksimal pembelian 2 pouch per struk.",
  },
  {
    name: "Beras Rojolele Delanggu 5 Kg",
    category: "Kebutuhan Pokok",
    storeName: "Pasar Kranggan (Kios Bu Warno Blok B)",
    storeType: StoreType.TRADITIONAL_MARKET,
    address: "Jl. Poncowinatan, Gowongan, Jetis, Kota Yogyakarta",
    normalPrice: 78000,
    discountPrice: 65000,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Beras pulen panen baru dari petani langsung. Harga spesial menyambut panen raya.",
  },
  {
    name: "Gula Pasir Gulaku Tebu Murni 1 Kg",
    category: "Kebutuhan Pokok",
    storeName: "Indomaret Point Colombo",
    storeType: StoreType.MINIMARKET,
    address: "Jl. Colombo No. 3, Caturtunggal, Depok, Sleman",
    normalPrice: 18500,
    discountPrice: 14900,
    stock: StockCondition.LIMITED,
    desc: "[DEMO DATA] Potongan harga member Indomaret Poinku. Stok di rak tinggal 1 karton.",
  },
  {
    name: "Telur Ayam Ras Segar 1 Kg (Isi 16 Butir)",
    category: "Kebutuhan Pokok",
    storeName: "Pasar Beringharjo Timur",
    storeType: StoreType.TRADITIONAL_MARKET,
    address: "Jl. Margo Mulyo No. 16, Ngupasan, Gondomanan, Yogyakarta",
    normalPrice: 29000,
    discountPrice: 23500,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Telur segar langsung dari peternak Bantul. Kondisi bersih dan utuh.",
  },
  {
    name: "Tepung Terigu Segitiga Biru 1 Kg",
    category: "Kebutuhan Pokok",
    storeName: "Toko Sembako Berkah Lancar",
    storeType: StoreType.LOCAL_STORE,
    address: "Jl. Affandi No. 42, Gejayan, Condongcatur, Sleman",
    normalPrice: 14500,
    discountPrice: 11500,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Obral cuci gudang toko kelontong. Kedaluwarsa masih 8 bulan ke depan.",
  },
  {
    name: "Indomie Goreng Original 1 Dus (Isi 40 Pcs)",
    category: "Kebutuhan Pokok",
    storeName: "Alfamart Gejayan Mrican",
    storeType: StoreType.MINIMARKET,
    address: "Jl. Gejayan No. 12, Santren, Caturtunggal, Sleman",
    normalPrice: 122000,
    discountPrice: 104500,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Promo Gajian Berkah Alfamart. Cocok untuk stok anak kos atau warung makan.",
  },
  {
    name: "Minyak Goreng Bimoli Klasik Refill 2 Liter",
    category: "Kebutuhan Pokok",
    storeName: "Lotte Grosir Maguwo",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Ring Road Utara, Maguwoharjo, Depok, Sleman",
    normalPrice: 42000,
    discountPrice: 31000,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Diskon borongan belanja akhir pekan. Stok melimpah di palet depan.",
  },
  {
    name: "Garam Dapur Beryodium Daun 250 Gram (Paket 3 Bks)",
    category: "Kebutuhan Pokok",
    storeName: "Toko Kelontong Bu Siti",
    storeType: StoreType.LOCAL_STORE,
    address: "Jl. Moses Gatotkaca No. 8, Mrican, Depok, Sleman",
    normalPrice: 9000,
    discountPrice: 6000,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Beli 3 bungkus cuma enam ribu rupiah. Garam halus murni berkualitas.",
  },
  {
    name: "Beras Ramos Wangi Premium 5 Kg",
    category: "Kebutuhan Pokok",
    storeName: "Superindo Sultan Agung",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Sultan Agung No. 72, Gunungketur, Pakualaman, Yogyakarta",
    normalPrice: 85000,
    discountPrice: 69900,
    stock: StockCondition.LIMITED,
    desc: "[DEMO DATA] Promo serbu beras murah! Pembelian dibatasi 1 karung per keluarga.",
  },
  {
    name: "Margarin Blue Band Serbaguna Sachet 200 Gram",
    category: "Kebutuhan Pokok",
    storeName: "Mirota Kampus Babarsari",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Babarsari No. 10, Caturtunggal, Depok, Sleman",
    normalPrice: 11500,
    discountPrice: 8200,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Diskon spesial kebutuhan kue dan memasak. Stok masih banyak di lorong 3.",
  },

  // 11-20: SAYUR & BUMBU
  {
    name: "Bawang Merah Brebes Super 1 Kg",
    category: "Sayur & Bumbu",
    storeName: "Pasar Kranggan (Lantai Dasar)",
    storeType: StoreType.TRADITIONAL_MARKET,
    address: "Jl. Poncowinatan, Gowongan, Jetis, Kota Yogyakarta",
    normalPrice: 38000,
    discountPrice: 27000,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Bawang merah ukuran sedang-besar kering tanpa busuk. Kiriman pagi dari Brebes.",
  },
  {
    name: "Bawang Putih Kating Bersih 1 Kg",
    category: "Sayur & Bumbu",
    storeName: "Pasar Condongcatur",
    storeType: StoreType.TRADITIONAL_MARKET,
    address: "Jl. Ring Road Utara, Condongcatur, Depok, Sleman",
    normalPrice: 42000,
    discountPrice: 33000,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Bawang putih wangi, siung besar, kulit kering dan tidak kopong.",
  },
  {
    name: "Cabai Rawit Merah (Cabai Setan) 500 Gram",
    category: "Sayur & Bumbu",
    storeName: "Pasar Beringharjo Timur",
    storeType: StoreType.TRADITIONAL_MARKET,
    address: "Jl. Margo Mulyo No. 16, Ngupasan, Gondomanan, Yogyakarta",
    normalPrice: 32000,
    discountPrice: 22000,
    stock: StockCondition.LIMITED,
    desc: "[DEMO DATA] Sedang panen raya di lereng Merapi, harga anjlok murah pol dan pedas segar.",
  },
  {
    name: "Tomat Buah Merah Segar 1 Kg",
    category: "Sayur & Bumbu",
    storeName: "Toko Buah & Sayur Segar Manis",
    storeType: StoreType.FRUIT_VEGETABLE_STORE,
    address: "Jl. Seturan Raya No. 15, Caturtunggal, Sleman",
    normalPrice: 14000,
    discountPrice: 9000,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Tomat segar manis cocok untuk jus dan sambal. Kulit kencang tanpa lebam.",
  },
  {
    name: "Wortel Brastagi Manis 1 Kg",
    category: "Sayur & Bumbu",
    storeName: "Superindo Kaliurang",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Kaliurang KM 6 No. 28, Sleman, DI Yogyakarta",
    normalPrice: 18000,
    discountPrice: 12900,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Wortel import kualitas super. Manis renyah sangat cocok untuk sop anak.",
  },
  {
    name: "Kentang Dieng Sedang 1 Kg",
    category: "Sayur & Bumbu",
    storeName: "Pasar Demangan",
    storeType: StoreType.TRADITIONAL_MARKET,
    address: "Jl. Gejayan No. 27, Demangan, Gondokusuman, Yogyakarta",
    normalPrice: 22000,
    discountPrice: 16500,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Kentang kuning Dieng tidak berair, sangat gurih dibuat perkedel atau kentang goreng.",
  },
  {
    name: "Kangkung Segar 3 Ikat",
    category: "Sayur & Bumbu",
    storeName: "Sayurbox Jogja Hub",
    storeType: StoreType.LOCAL_STORE,
    address: "https://sayurbox.com/area/jogja",
    normalPrice: 12000,
    discountPrice: 6500,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Promo Flash Sale pagi online Sayurbox. Sayur hidroponik bebas pestisida.",
  },
  {
    name: "Bayam Hijau Petik Segar 3 Ikat",
    category: "Sayur & Bumbu",
    storeName: "Pasar Sambilegi Maguwoharjo",
    storeType: StoreType.TRADITIONAL_MARKET,
    address: "Jl. Raya Solo KM 9, Maguwoharjo, Depok, Sleman",
    normalPrice: 10000,
    discountPrice: 5000,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Bayam hijau segar tanpa ulat dari kebun lokal Prambanan.",
  },
  {
    name: "Jeruk Nipis Wangi 500 Gram",
    category: "Sayur & Bumbu",
    storeName: "Toko Buah & Sayur Segar Manis",
    storeType: StoreType.FRUIT_VEGETABLE_STORE,
    address: "Jl. Seturan Raya No. 15, Caturtunggal, Sleman",
    normalPrice: 12000,
    discountPrice: 7500,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Airnya melimpah, kulit tipis tidak pahit. Pas untuk cuci amis ikan/daging.",
  },
  {
    name: "Jahe Merah Super Segar 500 Gram",
    category: "Sayur & Bumbu",
    storeName: "Pasar Kranggan (Lantai Dasar)",
    storeType: StoreType.TRADITIONAL_MARKET,
    address: "Jl. Poncowinatan, Gowongan, Jetis, Kota Yogyakarta",
    normalPrice: 24000,
    discountPrice: 17000,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Jahe merah rimpang tua pedas mantap untuk wedang hangat musim hujan.",
  },

  // 21-28: MINUMAN & SUSU
  {
    name: "Susu UHT Ultra Milk Full Cream 1000 ml",
    category: "Minuman & Susu",
    storeName: "Superindo Kaliurang",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Kaliurang KM 6 No. 28, Sleman, DI Yogyakarta",
    normalPrice: 21500,
    discountPrice: 16900,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Diskon akhir pekan Ultra Milk Plain. Expired masih 10 bulan lagi.",
  },
  {
    name: "Kopi Kenangan Mantancino Botol 220 ml (Beli 2 Gratis 1)",
    category: "Minuman & Susu",
    storeName: "Indomaret Point Colombo",
    storeType: StoreType.MINIMARKET,
    address: "Jl. Colombo No. 3, Caturtunggal, Depok, Sleman",
    normalPrice: 28500,
    discountPrice: 19000,
    stock: StockCondition.LIMITED,
    desc: "[DEMO DATA] Promo Beli 2 Dapat 3 untuk varian Mantancino & Avocado Coffee.",
  },
  {
    name: "Susu Kental Manis Frisian Flag Cokelat 370 Gram",
    category: "Minuman & Susu",
    storeName: "Alfamart Gejayan Mrican",
    storeType: StoreType.MINIMARKET,
    address: "Jl. Gejayan No. 12, Santren, Caturtunggal, Sleman",
    normalPrice: 13500,
    discountPrice: 9900,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Promo tebus murah dengan minimal transaksi 50rb di Alfamart.",
  },
  {
    name: "Teh Pucuk Harum 350 ml (Paket 3 Botol)",
    category: "Minuman & Susu",
    storeName: "Toko Sembako Berkah Lancar",
    storeType: StoreType.LOCAL_STORE,
    address: "Jl. Affandi No. 42, Gejayan, Condongcatur, Sleman",
    normalPrice: 12000,
    discountPrice: 9000,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Beli 3 botol cukup 9 ribu rupiah dingin di kulkas toko.",
  },
  {
    name: "Susu Cimory UHT Cokelat / Strawberry 250 ml",
    category: "Minuman & Susu",
    storeName: "Mirota Kampus Babarsari",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Babarsari No. 10, Caturtunggal, Depok, Sleman",
    normalPrice: 7000,
    discountPrice: 5100,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Diskon harga mahasiswa Mirota Kampus. Semua varian rasa diskon sama.",
  },
  {
    name: "Air Mineral Aqua Karton 600 ml (Isi 24 Botol)",
    category: "Minuman & Susu",
    storeName: "Lotte Grosir Maguwo",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Ring Road Utara, Maguwoharjo, Depok, Sleman",
    normalPrice: 56000,
    discountPrice: 46000,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Harga grosir langsung per dus. Cocok untuk acara atau stok kantor.",
  },
  {
    name: "Susu Bear Brand Steril 189 ml",
    category: "Minuman & Susu",
    storeName: "Indomaret Kaliurang KM 5",
    storeType: StoreType.MINIMARKET,
    address: "Jl. Kaliurang KM 5 No. 14, Sleman",
    normalPrice: 11200,
    discountPrice: 9200,
    stock: StockCondition.LIMITED,
    desc: "[DEMO DATA] Diskon Bear Brand Nestle murni. Maksimal beli 4 kaleng per orang.",
  },
  {
    name: "Kopi Kapal Api Spesial Mix (Renceng Isi 10 Sachet)",
    category: "Minuman & Susu",
    storeName: "Toko Kelontong Bu Siti",
    storeType: StoreType.LOCAL_STORE,
    address: "Jl. Moses Gatotkaca No. 8, Mrican, Depok, Sleman",
    normalPrice: 15000,
    discountPrice: 11800,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Kopi Kapal Api gula mantap asli. Stok baru datang minggu ini.",
  },

  // 29-35: DAGING & IKAN
  {
    name: "Daging Ayam Broiler Utuh Bersih 1 Kg",
    category: "Daging & Ikan",
    storeName: "Pasar Kranggan (Lantai Dasar)",
    storeType: StoreType.TRADITIONAL_MARKET,
    address: "Jl. Poncowinatan, Gowongan, Jetis, Kota Yogyakarta",
    normalPrice: 36000,
    discountPrice: 28000,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Ayam potong segar bersertifikasi halal, daging kenyal tidak berlendir.",
  },
  {
    name: "Daging Sapi Rawon Segar Lokal 1 Kg",
    category: "Daging & Ikan",
    storeName: "Pasar Beringharjo Timur",
    storeType: StoreType.TRADITIONAL_MARKET,
    address: "Jl. Margo Mulyo No. 16, Ngupasan, Gondomanan, Yogyakarta",
    normalPrice: 135000,
    discountPrice: 110000,
    stock: StockCondition.LIMITED,
    desc: "[DEMO DATA] Daging segar potongan rawon/gulai empuk langsung dari jagal Bantul.",
  },
  {
    name: "Ikan Nila Hidup Segar Kolam 1 Kg",
    category: "Daging & Ikan",
    storeName: "Pasar Condongcatur",
    storeType: StoreType.TRADITIONAL_MARKET,
    address: "Jl. Ring Road Utara, Condongcatur, Depok, Sleman",
    normalPrice: 34000,
    discountPrice: 26500,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Ikan nila segar bisa minta tolong dibersihkan dan dipotong langsung di tempat.",
  },
  {
    name: "Fillet Dada Ayam Tanpa Tulang & Kulit 500 Gram",
    category: "Daging & Ikan",
    storeName: "Superindo Sultan Agung",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Sultan Agung No. 72, Gunungketur, Pakualaman, Yogyakarta",
    normalPrice: 32000,
    discountPrice: 24500,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Diskon produk segar Superindo. Sangat pas untuk menu diet tinggi protein.",
  },
  {
    name: "Udang Vaname Segar Laut 500 Gram",
    category: "Daging & Ikan",
    storeName: "Pasar Demangan",
    storeType: StoreType.TRADITIONAL_MARKET,
    address: "Jl. Gejayan No. 27, Demangan, Gondokusuman, Yogyakarta",
    normalPrice: 48000,
    discountPrice: 36000,
    stock: StockCondition.LIMITED,
    desc: "[DEMO DATA] Udang manis segar dari pantai Kulon Progo. Ukuran sedang isi 25-30 ekor.",
  },
  {
    name: "Ikan Lele Segar Ukuran Konsumsi 1 Kg",
    category: "Daging & Ikan",
    storeName: "Pasar Sambilegi Maguwoharjo",
    storeType: StoreType.TRADITIONAL_MARKET,
    address: "Jl. Raya Solo KM 9, Maguwoharjo, Depok, Sleman",
    normalPrice: 28000,
    discountPrice: 21000,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Lele pakan pelet bersih isi 7-8 ekor sekilo. Daging gurih tidak bau lumpur.",
  },
  {
    name: "Daging Cincang Sapi Australia Halal 500 Gram",
    category: "Daging & Ikan",
    storeName: "Superindo Kaliurang",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Kaliurang KM 6 No. 28, Sleman, DI Yogyakarta",
    normalPrice: 65000,
    discountPrice: 49900,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Daging giling premium cocok untuk pasta bolognese atau patty burger rumahan.",
  },

  // 36-42: PEMBERSIH RUMAH
  {
    name: "Sabun Cuci Piring Sunlight Jeruk Nipis Refill 750 ml",
    category: "Pembersih Rumah",
    storeName: "Alfamart Gejayan Mrican",
    storeType: StoreType.MINIMARKET,
    address: "Jl. Gejayan No. 12, Santren, Caturtunggal, Sleman",
    normalPrice: 17500,
    discountPrice: 11900,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Sunlight jumbo paling laris, ampuh bersihkan lemak membandel 10x lebih cepat.",
  },
  {
    name: "Deterjen Rinso Molto Anti Noda Cair 750 ml",
    category: "Pembersih Rumah",
    storeName: "Indomaret Point Colombo",
    storeType: StoreType.MINIMARKET,
    address: "Jl. Colombo No. 3, Caturtunggal, Depok, Sleman",
    normalPrice: 24500,
    discountPrice: 17900,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Promo JSM akhir pekan Indomaret. Harum tahan lama hingga 21 hari.",
  },
  {
    name: "Pembersih Lantai So Klin Aroma Citrus 780 ml",
    category: "Pembersih Rumah",
    storeName: "Mirota Kampus Babarsari",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Babarsari No. 10, Caturtunggal, Depok, Sleman",
    normalPrice: 12500,
    discountPrice: 8900,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Lantai wangi segar kilap bebas kuman dan nyamuk seharian.",
  },
  {
    name: "Wipol Karbol Wangi Cemara Disinfektan 750 ml",
    category: "Pembersih Rumah",
    storeName: "Superindo Kaliurang",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Kaliurang KM 6 No. 28, Sleman, DI Yogyakarta",
    normalPrice: 22000,
    discountPrice: 15500,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Bunuh kuman 99.9% dan hilangkan bau kamar mandi seketika.",
  },
  {
    name: "Mama Lemon Sabun Jeruk Nipis Refill 680 ml (Beli 2 Lebih Hemat)",
    category: "Pembersih Rumah",
    storeName: "Toko Sembako Berkah Lancar",
    storeType: StoreType.LOCAL_STORE,
    address: "Jl. Affandi No. 42, Gejayan, Condongcatur, Sleman",
    normalPrice: 15000,
    discountPrice: 9500,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Obral produk rumah tangga harga distributor.",
  },
  {
    name: "Pewangi Pakaian Downy Mystique Refill 650 ml",
    category: "Pembersih Rumah",
    storeName: "Superindo Sultan Agung",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Sultan Agung No. 72, Gunungketur, Pakualaman, Yogyakarta",
    normalPrice: 38000,
    discountPrice: 27900,
    stock: StockCondition.LIMITED,
    desc: "[DEMO DATA] Parfum mewah konsentrat tahan lama. Stok di rak tersisa sedikit.",
  },
  {
    name: "Baygon Obat Nyamuk Semprot Eucalyptus 600 ml",
    category: "Pembersih Rumah",
    storeName: "Lotte Grosir Maguwo",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Ring Road Utara, Maguwoharjo, Depok, Sleman",
    normalPrice: 44000,
    discountPrice: 31500,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Perlindungan dari nyamuk demam berdarah. Aroma segar tidak bikin batuk.",
  },

  // 43-48: CAMILAN & ROTI
  {
    name: "Roti Tawar Kupas Sari Roti 200 Gram",
    category: "Camilan & Roti",
    storeName: "Indomaret Kaliurang KM 5",
    storeType: StoreType.MINIMARKET,
    address: "Jl. Kaliurang KM 5 No. 14, Sleman",
    normalPrice: 17000,
    discountPrice: 13500,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Roti tawar lembut tanpa kulit, cocok untuk sarapan cepat pagi hari.",
  },
  {
    name: "Biskuit Khong Guan Classic Assorted Kaleng 650 Gram",
    category: "Camilan & Roti",
    storeName: "Superindo Kaliurang",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Kaliurang KM 6 No. 28, Sleman, DI Yogyakarta",
    normalPrice: 62000,
    discountPrice: 47900,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Kaleng biskuit aneka rasa legendaris keluarga Indonesia harga promo.",
  },
  {
    name: "Oreo Biskuit Vanilla Sandwich 123.5 Gram (Beli 2)",
    category: "Camilan & Roti",
    storeName: "Alfamart Gejayan Mrican",
    storeType: StoreType.MINIMARKET,
    address: "Jl. Gejayan No. 12, Santren, Caturtunggal, Sleman",
    normalPrice: 19000,
    discountPrice: 13000,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Beli 2 bungkus lebih hemat 6 ribu rupiah di gerai Alfamart.",
  },
  {
    name: "Chitato Keripik Kentang Sapi Panggang 68 Gram",
    category: "Camilan & Roti",
    storeName: "Mirota Kampus Babarsari",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Babarsari No. 10, Caturtunggal, Depok, Sleman",
    normalPrice: 12500,
    discountPrice: 9400,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Camilan favorit anak kos nonton film. Rasa daging sapi panggang renyah bergelombang.",
  },
  {
    name: "Wafer Nabati Keju Richeese Kaleng 287 Gram",
    category: "Camilan & Roti",
    storeName: "Lotte Grosir Maguwo",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Ring Road Utara, Maguwoharjo, Depok, Sleman",
    normalPrice: 32000,
    discountPrice: 22500,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Wafer keju renyah manis gurih favorit anak-anak.",
  },
  {
    name: "Kacang Kulit Garuda Garing 375 Gram",
    category: "Camilan & Roti",
    storeName: "Toko Kelontong Bu Siti",
    storeType: StoreType.LOCAL_STORE,
    address: "Jl. Moses Gatotkaca No. 8, Mrican, Depok, Sleman",
    normalPrice: 27000,
    discountPrice: 19800,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Kacang kulit renyah isi 2-3 butir gurih tanpa alot.",
  },

  // 49-52: PERLENGKAPAN BAYI & ONLINE
  {
    name: "MamyPoko Pants Standar Tidak Gembung Ukuran M 34",
    category: "Perlengkapan Bayi",
    storeName: "Superindo Sultan Agung",
    storeType: StoreType.SUPERMARKET,
    address: "Jl. Sultan Agung No. 72, Gunungketur, Pakualaman, Yogyakarta",
    normalPrice: 68000,
    discountPrice: 49900,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Popok celana bayi nyaman anti bocor hingga 10 jam pemakaian.",
  },
  {
    name: "Minyak Telon My Baby Plus Minyak Kayu Putih 150 ml",
    category: "Perlengkapan Bayi",
    storeName: "Indomaret Kaliurang KM 5",
    storeType: StoreType.MINIMARKET,
    address: "Jl. Kaliurang KM 5 No. 14, Sleman",
    normalPrice: 31000,
    discountPrice: 23500,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Lindungi si kecil dari gigitan nyamuk hingga 8 jam dengan wangi khas menenangkan.",
  },
  {
    name: "Tisu Basah Mitu Baby Non Alkohol 50 Sheets (Beli 1 Gratis 1)",
    category: "Perlengkapan Bayi",
    storeName: "Alfamart Gejayan Mrican",
    storeType: StoreType.MINIMARKET,
    address: "Jl. Gejayan No. 12, Santren, Caturtunggal, Sleman",
    normalPrice: 24000,
    discountPrice: 14500,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Paket bundling hemat beli 1 gratis 1 tisu basah lembut tanpa alkohol.",
  },
  {
    name: "Paket Sayur Sop Komplit + Sambal Terasi",
    category: "Sayur & Bumbu",
    storeName: "Shopee Supermarket Official",
    storeType: StoreType.LOCAL_STORE,
    address: "https://shopee.co.id/supermarket/promo-sayur-segar",
    normalPrice: 18000,
    discountPrice: 9900,
    stock: StockCondition.PLENTY,
    desc: "[DEMO DATA] Paket hemat sekali masak siap olah dari Shopee Supermarket. Pengiriman instan 2 jam.",
  },
];

// Daftar 10 User Komunitas Simultan
const DEMO_USERS = [
  {
    name: "Siti Rahmawati",
    email: "siti.rahma@demo.temurah.id",
    preference: UserPreference.HOUSEWIFE,
  },
  {
    name: "Budi Santoso",
    email: "budi.santoso@demo.temurah.id",
    preference: UserPreference.WORKER,
  },
  {
    name: "Rizky Ramadhan",
    email: "rizky.mhs@demo.temurah.id",
    preference: UserPreference.STUDENT,
  },
  {
    name: "Hj. Endang Suryani",
    email: "bu.endang@demo.temurah.id",
    preference: UserPreference.HOUSEWIFE,
  },
  {
    name: "Dimas Prasetyo",
    email: "dimas.tech@demo.temurah.id",
    preference: UserPreference.WORKER,
  },
  {
    name: "Anisa Putri",
    email: "anisa.ugm@demo.temurah.id",
    preference: UserPreference.STUDENT,
  },
  {
    name: "Pak Warno Kios",
    email: "warno.pedagang@demo.temurah.id",
    preference: UserPreference.MSME_OWNER,
  },
  {
    name: "Dewi Lestari",
    email: "dewi.lestari@demo.temurah.id",
    preference: UserPreference.GENERAL,
  },
  {
    name: "Agus Pratama",
    email: "agus.pratama@demo.temurah.id",
    preference: UserPreference.MSME_OWNER,
  },
  {
    name: "Maya Anggraini",
    email: "maya.deal@demo.temurah.id",
    preference: UserPreference.GENERAL,
  },
];

const SAMPLE_COMMENTS = [
  "Wah terima kasih infonya tetangga! Tadi siang langsung mampir dan harganya beneran segini di kasir.",
  "Stoknya tadi pas aku beli jam 3 sore masih lumayan banyak di lorong promo.",
  "Minyak goreng merk ini memang lagi promo besar di semua cabangnya minggu ini.",
  "Sangat membantu untuk penghematan belanja bulanan keluarga. Rekomendasi banget!",
  "Berasnya beneran pulen dan wangi, baru aja dimasak untuk makan malam tadi.",
  "Bagi yang mau beli sebaiknya pagi-pagi ya biar gak kehabisan antrean.",
  "Mantap diskonnya riil, struk bukti pembelian juga jelas tertera.",
  "Kualitas sayurnya segar banget gak ada yang layu.",
  "Susu UHT-nya expired masih lama sampai tahun depan, langsung borong 4 kotak tadi.",
  "Info yang sangat bermanfaat buat anak kosan akhir bulan, terima kasih kontributor!",
];

async function main() {
  console.log("🌱 ========================================================");
  console.log("🚀 MEMULAI SEEDER DEMO LENGKAP TEMURAH (50+ PRODUK & USER)");
  console.log("========================================================\n");

  const defaultPasswordHash = await bcrypt.hash("demo12345", 10);

  // 1. Pastikan Kategori Ada di Database
  const categoriesMap = new Map<string, string>();
  let categories = await prisma.category.findMany();
  
  if (categories.length === 0) {
    console.log("-> Kategori belum ada, membuat kategori master default...");
    const initialCategories = [
      { name: "Kebutuhan Pokok", slug: "kebutuhan-pokok" },
      { name: "Sayur & Bumbu", slug: "sayur-bumbu" },
      { name: "Minuman & Susu", slug: "minuman-susu" },
      { name: "Pembersih Rumah", slug: "pembersih-rumah" },
      { name: "Daging & Ikan", slug: "daging-ikan" },
      { name: "Camilan & Roti", slug: "camilan-roti" },
      { name: "Perlengkapan Bayi", slug: "perlengkapan-bayi" },
      { name: "Lainnya", slug: "lainnya" },
    ];
    for (const c of initialCategories) {
      const cat = await prisma.category.upsert({
        where: { slug: c.slug },
        update: { name: c.name },
        create: { name: c.name, slug: c.slug },
      });
      categoriesMap.set(cat.name, cat.id);
    }
    console.log("   [✓] Kategori master dibuat.");
  } else {
    for (const cat of categories) {
      categoriesMap.set(cat.name, cat.id);
    }
  }

  // 2. Buat Pengguna Demo
  console.log(`-> Membuat ${DEMO_USERS.length} akun warga komunitas simulasi...`);
  const createdUsers = [];
  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        preference: u.preference,
        passwordHash: defaultPasswordHash,
        isBanned: false,
      },
      create: {
        email: u.email,
        name: u.name,
        preference: u.preference,
        passwordHash: defaultPasswordHash,
        isBanned: false,
      },
    });
    createdUsers.push(user);
  }
  console.log(`   [✓] ${createdUsers.length} pengguna komunitas aktif siap.`);

  // 3. Buat Toko-Toko Terkait
  console.log("-> Menyiapkan data toko fisik & online...");
  const storesMap = new Map<string, string>();
  const uniqueStores = Array.from(
    new Set(DEMO_ITEMS.map((item) => JSON.stringify({ name: item.storeName, type: item.storeType, address: item.address })))
  ).map((s) => JSON.parse(s));

  for (const s of uniqueStores) {
    // Generate koordinat acak sekitar Yogyakarta / Sleman
    const lat = -7.7828 + (Math.random() - 0.5) * 0.05;
    const lng = 110.3671 + (Math.random() - 0.5) * 0.05;

    let store = await prisma.store.findFirst({
      where: { name: s.name },
    });

    if (!store) {
      store = await prisma.store.create({
        data: {
          name: s.name,
          storeType: s.type,
          address: s.address,
          latitude: lat,
          longitude: lng,
          createdByUserId: createdUsers[0].id,
        },
      });
    }
    storesMap.set(s.name, store.id);
  }
  console.log(`   [✓] ${storesMap.size} toko telah terdaftar.`);

  // 4. Masukkan 50+ Produk Promo
  console.log(`-> Menyebarkan ${DEMO_ITEMS.length} postingan diskon & promo...`);
  let promoIndex = 0;

  for (const item of DEMO_ITEMS) {
    promoIndex++;
    const categoryId = categoriesMap.get(item.category) || Array.from(categoriesMap.values())[0];
    const storeId = storesMap.get(item.storeName)!;
    const authorUser = createdUsers[promoIndex % createdUsers.length];

    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 7 + (promoIndex % 14)); // Promo aktif 7-21 hari ke depan

    const imageUrl = getRandomImage(item.category, promoIndex);

    // Buat atau perbarui promo
    const existingPromo = await prisma.promotion.findFirst({
      where: {
        productName: item.name,
        storeId: storeId,
      },
    });

    let promoId = existingPromo?.id;

    if (!existingPromo) {
      const promo = await prisma.promotion.create({
        data: {
          productName: item.name,
          description: item.desc,
          normalPrice: item.normalPrice,
          discountPrice: item.discountPrice,
          stockCondition: item.stock,
          status: PromotionStatus.ACTIVE,
          imageUrl: imageUrl,
          endsAt: endsAt,
          categoryId: categoryId,
          storeId: storeId,
          createdByUserId: authorUser.id,
        },
      });
      promoId = promo.id;
    } else {
      await prisma.promotion.update({
        where: { id: existingPromo.id },
        data: {
          description: item.desc,
          normalPrice: item.normalPrice,
          discountPrice: item.discountPrice,
          imageUrl: imageUrl,
          status: PromotionStatus.ACTIVE,
        },
      });
    }

    if (promoId) {
      process.stdout.write(`   [${promoIndex}/${DEMO_ITEMS.length}] Memproses: ${item.name.slice(0, 35)}...\r`);

      // 5. Tambahkan Komentar Warga (1 s/d 3 komentar per promo)
      const commentsCount = 1 + (promoIndex % 3);
      for (let c = 0; c < commentsCount; c++) {
        const commentUser = createdUsers[(promoIndex + c + 1) % createdUsers.length];
        const commentText = SAMPLE_COMMENTS[(promoIndex + c) % SAMPLE_COMMENTS.length];

        const existingComment = await prisma.comment.findFirst({
          where: {
            promotionId: promoId,
            userId: commentUser.id,
          },
        });

        if (!existingComment) {
          await prisma.comment.create({
            data: {
              promotionId: promoId,
              userId: commentUser.id,
              content: commentText,
            },
          });
        }
      }

      // 6. Tambahkan Validasi Warga (2 s/d 7 validasi 'VALID')
      const validationCount = 2 + (promoIndex % 6);
      for (let v = 0; v < validationCount; v++) {
        const voterUser = createdUsers[(promoIndex + v + 2) % createdUsers.length];
        
        await prisma.promotionValidation.upsert({
          where: {
            promotionId_userId: {
              promotionId: promoId,
              userId: voterUser.id,
            },
          },
          update: {
            validationType: ValidationType.VALID,
            note: "Dikonfirmasi masih berlaku di lokasi",
          },
          create: {
            promotionId: promoId,
            userId: voterUser.id,
            validationType: ValidationType.VALID,
            note: "Dikonfirmasi masih berlaku di lokasi",
          },
        });
      }

      // Berikan jeda ringan (throttle) setiap 5 item agar tidak membebani connection limit serverless Neon
      if (promoIndex % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }
  }

  console.log(`   [✓] Sukses memasukkan ${DEMO_ITEMS.length} item promo diskon lengkap!`);
  console.log("\n========================================================");
  console.log("🎉 SEEDER DEMO BERHASIL DIJALANKAN!");
  console.log("========================================================");
  console.log(`Total Promo     : ${DEMO_ITEMS.length} item`);
  console.log(`Total Warga     : ${createdUsers.length} pengguna`);
  console.log(`Password Warga  : demo12345 (untuk semua akun demo)`);
  console.log("Contoh Akun Warga:");
  console.log("1. siti.rahma@demo.temurah.id (Ibu Rumah Tangga)");
  console.log("2. rizky.mhs@demo.temurah.id (Mahasiswa)");
  console.log("3. budi.santoso@demo.temurah.id (Pekerja)");
  console.log("========================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed demo error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
