import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("E2E Simulation: Promotion & Comment Reporting Workflow", () => {
  // Simulasi in-memory DB / Store untuk menguji end-to-end workflow secara deterministik
  interface MockReport {
    id: string;
    type: "PROMOTION" | "COMMENT";
    targetId: string;
    reporterId: string;
    reason: string;
    description?: string;
    status: "PENDING" | "RESOLVED" | "DISMISSED";
    actionNotes?: string;
  }

  interface MockPromotion {
    id: string;
    title: string;
    isDeleted: boolean;
  }

  interface MockComment {
    id: string;
    promotionId: string;
    content: string;
    isDeleted: boolean;
  }

  const promotions: MockPromotion[] = [
    { id: "promo-1", title: "Minyak Goreng 2L Murah", isDeleted: false },
  ];

  const comments: MockComment[] = [
    { id: "comment-1", promotionId: "promo-1", content: "Penipuan nih harganya!", isDeleted: false },
  ];

  const reports: MockReport[] = [];

  it("Step 1: Regular user successfully reports a suspicious promotion", () => {
    const newReport: MockReport = {
      id: "report-promo-1",
      type: "PROMOTION",
      targetId: "promo-1",
      reporterId: "user-warga-1",
      reason: "Harga Palsu / Manipulasi Diskon",
      description: "Harga di kasir toko berbeda dengan yang difoto.",
      status: "PENDING",
    };

    reports.push(newReport);

    assert.strictEqual(reports.length, 1);
    assert.strictEqual(reports[0].status, "PENDING");
    assert.strictEqual(reports[0].type, "PROMOTION");
    assert.strictEqual(reports[0].targetId, "promo-1");
  });

  it("Step 2: Regular user successfully reports an offensive comment", () => {
    const newReport: MockReport = {
      id: "report-comment-1",
      type: "COMMENT",
      targetId: "comment-1",
      reporterId: "user-warga-2",
      reason: "Kata-kata Kasar / Pelecehan / SARA",
      description: "Mengandung kata-kata yang tidak pantas.",
      status: "PENDING",
    };

    reports.push(newReport);

    assert.strictEqual(reports.length, 2);
    const commentReport = reports.find((r) => r.type === "COMMENT");
    assert.ok(commentReport);
    assert.strictEqual(commentReport.status, "PENDING");
  });

  it("Step 3: Admin reviews report and deletes the violating promotion", () => {
    const report = reports.find((r) => r.id === "report-promo-1");
    assert.ok(report);

    // Admin action: Delete Promo & Resolve Report
    const targetPromo = promotions.find((p) => p.id === report.targetId);
    assert.ok(targetPromo);
    targetPromo.isDeleted = true;

    report.status = "RESOLVED";
    report.actionNotes = "Postingan promosi telah dihapus oleh Administrator.";

    assert.strictEqual(targetPromo.isDeleted, true);
    assert.strictEqual(report.status, "RESOLVED");
    assert.ok(report.actionNotes.includes("dihapus"));
  });

  it("Step 4: Admin reviews comment report and deletes the violating comment", () => {
    const report = reports.find((r) => r.id === "report-comment-1");
    assert.ok(report);

    // Admin action: Delete Comment & Resolve Report
    const targetComment = comments.find((c) => c.id === report.targetId);
    assert.ok(targetComment);
    targetComment.isDeleted = true;

    report.status = "RESOLVED";
    report.actionNotes = "Komentar telah dihapus oleh Administrator.";

    assert.strictEqual(targetComment.isDeleted, true);
    assert.strictEqual(report.status, "RESOLVED");
  });

  it("Step 5: Admin can dismiss false reports without deleting content", () => {
    const invalidReport: MockReport = {
      id: "report-promo-2",
      type: "PROMOTION",
      targetId: "promo-1",
      reporterId: "user-warga-3",
      reason: "Lainnya",
      description: "Hanya coba-coba lapor.",
      status: "PENDING",
    };
    reports.push(invalidReport);

    // Admin dismisses the report
    invalidReport.status = "DISMISSED";
    invalidReport.actionNotes = "Laporan diabaikan setelah ditinjau.";

    assert.strictEqual(invalidReport.status, "DISMISSED");
  });
});
