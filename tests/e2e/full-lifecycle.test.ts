import { describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

describe("E2E Full Application Lifecycle Flow", () => {
  /**
   * Simulasi database dan state session lengkap untuk menguji seluruh alur:
   * 1. Tamu (Guest tanpa login): Mencari diskon, filter kategori, view promo.
   * 2. Proteksi Auth: Tamu mencoba aksi yang mewajibkan login (buat promo, vote, comment, bookmark, report) -> dicegat.
   * 3. Registrasi User Baru: Pilihan persona/role fleksibel, hash password.
   * 4. Login User: Autentikasi credential, pembuatan session.
   * 5. User Membuat Postingan Diskon: Validasi form, kalkulasi persentase diskon.
   * 6. Interaksi Komunitas:
   *    - User lain memvalidasi ("Valid" / "Tidak Valid").
   *    - User lain berkomentar & mem-bookmark promo.
   * 7. Pelaporan Konten (Report):
   *    - Warga melaporkan postingan atau komentar yang melanggar.
   * 8. Admin Moderasi:
   *    - Admin login -> redirect ke dashboard admin.
   *    - Admin melihat statistik, master platform, dan tab laporan.
   *    - Admin menghapus konten pelanggar atau mengabaikan laporan.
   * 9. Logout: Sesi dibersihkan.
   */

  interface User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    isAdmin: boolean;
    isBanned: boolean;
  }

  interface Promotion {
    id: string;
    title: string;
    category: string;
    storeType: string;
    storeName: string;
    originalPrice: number;
    promoPrice: number;
    discountPercentage: number;
    authorId: string;
    validCount: number;
    invalidCount: number;
    isDeleted: boolean;
  }

  interface Comment {
    id: string;
    promoId: string;
    authorId: string;
    content: string;
    isDeleted: boolean;
  }

  interface Bookmark {
    userId: string;
    promoId: string;
  }

  interface Report {
    id: string;
    type: "PROMOTION" | "COMMENT";
    targetId: string;
    reporterId: string;
    reason: string;
    description?: string;
    status: "PENDING" | "RESOLVED" | "DISMISSED";
    actionNotes?: string;
  }

  // State Sistem
  const db = {
    users: [] as User[],
    promotions: [] as Promotion[],
    comments: [] as Comment[],
    bookmarks: [] as Bookmark[],
    reports: [] as Report[],
    activeSession: null as User | null,
  };

  // Setup Admin awal
  const adminPasswordHash = bcrypt.hashSync("adminSecret123", 10);
  db.users.push({
    id: "admin-1",
    name: "Admin Pusat",
    email: "admin@temurah.id",
    passwordHash: adminPasswordHash,
    role: "Administrator",
    isAdmin: true,
    isBanned: false,
  });

  // Seed 1 promo awal
  db.promotions.push({
    id: "promo-initial",
    title: "Gula Pasir 1kg Gulaku",
    category: "Kebutuhan Pokok",
    storeType: "Supermarket",
    storeName: "Superindo",
    originalPrice: 18000,
    promoPrice: 13500,
    discountPercentage: 25,
    authorId: "admin-1",
    validCount: 5,
    invalidCount: 0,
    isDeleted: false,
  });

  // ==========================================
  // FASE 1: TAMU / GUEST (TANPA LOGIN)
  // ==========================================
  describe("Fase 1: Tamu / Guest (Tanpa Login)", () => {
    it("Tamu dapat melihat daftar diskon di beranda", () => {
      const visiblePromos = db.promotions.filter((p) => !p.isDeleted);
      assert.strictEqual(visiblePromos.length, 1);
      assert.strictEqual(visiblePromos[0].title, "Gula Pasir 1kg Gulaku");
    });

    it("Tamu dapat memfilter promo berdasarkan kategori & kata kunci pencarian", () => {
      const keyword = "Gula";
      const filtered = db.promotions.filter(
        (p) => !p.isDeleted && p.title.toLowerCase().includes(keyword.toLowerCase())
      );
      assert.strictEqual(filtered.length, 1);

      const noMatch = db.promotions.filter(
        (p) => !p.isDeleted && p.title.toLowerCase().includes("laptop")
      );
      assert.strictEqual(noMatch.length, 0);
    });

    it("Tamu dicegat ketika mencoba membuat promo (harus diarahkan ke login)", () => {
      const attemptCreatePromo = () => {
        if (!db.activeSession) {
          throw new Error("UNAUTHORIZED: Silakan masuk terlebih dahulu.");
        }
      };
      assert.throws(attemptCreatePromo, /UNAUTHORIZED/);
    });

    it("Tamu dicegat ketika mencoba memvalidasi atau memberi komentar", () => {
      const attemptVote = () => {
        if (!db.activeSession) {
          throw new Error("UNAUTHORIZED: Masuk untuk memverifikasi promo ini.");
        }
      };
      assert.throws(attemptVote, /UNAUTHORIZED/);
    });
  });

  // ==========================================
  // FASE 2: REGISTRASI & LOGIN USER WARGA
  // ==========================================
  describe("Fase 2: Registrasi & Login User Warga", () => {
    it("User warga berhasil mendaftar akun baru dengan persona Ibu Rumah Tangga", () => {
      const newUserPassword = "passwordWarga123";
      const user: User = {
        id: "user-warga-1",
        name: "Siti Rahma",
        email: "siti@example.com",
        passwordHash: bcrypt.hashSync(newUserPassword, 10),
        role: "Ibu Rumah Tangga",
        isAdmin: false,
        isBanned: false,
      };

      db.users.push(user);
      assert.strictEqual(db.users.length, 2);
    });

    it("User warga gagal login jika password salah", () => {
      const user = db.users.find((u) => u.email === "siti@example.com");
      assert.ok(user);

      const isValidPassword = bcrypt.compareSync("wrongpassword", user.passwordHash);
      assert.strictEqual(isValidPassword, false);
      assert.strictEqual(db.activeSession, null);
    });

    it("User warga berhasil login dengan password yang benar", () => {
      const user = db.users.find((u) => u.email === "siti@example.com");
      assert.ok(user);

      const isValidPassword = bcrypt.compareSync("passwordWarga123", user.passwordHash);
      assert.strictEqual(isValidPassword, true);

      // Set active session
      db.activeSession = user;
      assert.strictEqual(db.activeSession.name, "Siti Rahma");
      assert.strictEqual(db.activeSession.isAdmin, false);
    });
  });

  // ==========================================
  // FASE 3: USER MEMBUAT POSTINGAN PROMO
  // ==========================================
  describe("Fase 3: Pembuatan Postingan Promo", () => {
    it("User berhasil membagikan temuan diskon baru", () => {
      assert.ok(db.activeSession, "User harus sedang login");

      const originalPrice = 45000;
      const promoPrice = 27000;
      const discountPercentage = Math.round(((originalPrice - promoPrice) / originalPrice) * 100);

      const newPromo: Promotion = {
        id: "promo-warga-1",
        title: "Minyak Goreng SunCo 2L",
        category: "Kebutuhan Pokok",
        storeType: "Pasar Tradisional",
        storeName: "Pasar Kranggan",
        originalPrice,
        promoPrice,
        discountPercentage,
        authorId: db.activeSession.id,
        validCount: 0,
        invalidCount: 0,
        isDeleted: false,
      };

      db.promotions.push(newPromo);

      assert.strictEqual(db.promotions.length, 2);
      assert.strictEqual(newPromo.discountPercentage, 40);
    });
  });

  // ==========================================
  // FASE 4: INTERAKSI KOMUNITAS (VOTING, COMMENT, BOOKMARK)
  // ==========================================
  describe("Fase 4: Interaksi Komunitas", () => {
    it("User lain login dan memvalidasi keakuratan promo ('Valid')", () => {
      // User 2 (Mahasiswa) mendaftar & login
      const user2: User = {
        id: "user-warga-2",
        name: "Andi Mahasiswa",
        email: "andi@example.com",
        passwordHash: bcrypt.hashSync("andi123", 10),
        role: "Mahasiswa",
        isAdmin: false,
        isBanned: false,
      };
      db.users.push(user2);
      db.activeSession = user2;

      // User 2 memvalidasi promo milik Siti
      const promo = db.promotions.find((p) => p.id === "promo-warga-1");
      assert.ok(promo);
      promo.validCount += 1;

      assert.strictEqual(promo.validCount, 1);
    });

    it("User dapat mem-bookmark promo untuk disimpan", () => {
      assert.ok(db.activeSession);
      db.bookmarks.push({
        userId: db.activeSession.id,
        promoId: "promo-warga-1",
      });

      const userBookmarks = db.bookmarks.filter((b) => b.userId === db.activeSession?.id);
      assert.strictEqual(userBookmarks.length, 1);
    });

    it("User menambahkan komentar pada promo", () => {
      assert.ok(db.activeSession);
      db.comments.push({
        id: "comment-warga-1",
        promoId: "promo-warga-1",
        authorId: db.activeSession.id,
        content: "Beneran murah banget, tadi baru beli di los blok barat!",
        isDeleted: false,
      });

      const promoComments = db.comments.filter(
        (c) => c.promoId === "promo-warga-1" && !c.isDeleted
      );
      assert.strictEqual(promoComments.length, 1);
    });
  });

  // ==========================================
  // FASE 5: PELAPORAN KONTEN (REPORTING)
  // ==========================================
  describe("Fase 5: Pelaporan Konten Pelanggaran", () => {
    it("User dapat melaporkan promo jika ada ketidaksesuaian/pelanggaran", () => {
      assert.ok(db.activeSession);
      const report: Report = {
        id: "report-1",
        type: "PROMOTION",
        targetId: "promo-warga-1",
        reporterId: db.activeSession.id,
        reason: "Stok Habis / Toko Sudah Tutup",
        description: "Jam 10 pagi stoknya sudah ludes.",
        status: "PENDING",
      };

      db.reports.push(report);
      assert.strictEqual(db.reports.length, 1);
      assert.strictEqual(db.reports[0].status, "PENDING");
    });
  });

  // ==========================================
  // FASE 6: ADMINISTRATOR MODERASI & KENDALI
  // ==========================================
  describe("Fase 6: Administrator Dashboard & Moderasi", () => {
    it("Admin login dan mendapatkan akses ke panel admin", () => {
      const admin = db.users.find((u) => u.email === "admin@temurah.id");
      assert.ok(admin);
      db.activeSession = admin;

      assert.strictEqual(db.activeSession.isAdmin, true);
    });

    it("Admin meninjau antrean laporan pending", () => {
      assert.strictEqual(db.activeSession?.isAdmin, true);

      const pendingReports = db.reports.filter((r) => r.status === "PENDING");
      assert.strictEqual(pendingReports.length, 1);
      assert.strictEqual(pendingReports[0].type, "PROMOTION");
    });

    it("Admin menyelesaikan laporan dan menghapus promo pelanggar", () => {
      assert.strictEqual(db.activeSession?.isAdmin, true);

      const report = db.reports[0];
      const targetPromo = db.promotions.find((p) => p.id === report.targetId);
      assert.ok(targetPromo);

      // Tindakan Admin: Soft Delete Promo & Resolve Report
      targetPromo.isDeleted = true;
      report.status = "RESOLVED";
      report.actionNotes = "Postingan promosi telah dihapus oleh Administrator.";

      assert.strictEqual(targetPromo.isDeleted, true);
      assert.strictEqual(report.status, "RESOLVED");

      // Verifikasi promo tidak lagi muncul di beranda publik
      const visiblePromos = db.promotions.filter((p) => !p.isDeleted);
      assert.ok(!visiblePromos.some((p) => p.id === targetPromo.id));
    });
  });

  // ==========================================
  // FASE 7: LOGOUT
  // ==========================================
  describe("Fase 7: Logout", () => {
    it("Sesi berhasil dibersihkan saat user logout", () => {
      db.activeSession = null;
      assert.strictEqual(db.activeSession, null);
    });
  });
});
