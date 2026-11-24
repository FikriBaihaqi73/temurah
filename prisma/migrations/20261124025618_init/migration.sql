-- CreateEnum
CREATE TYPE "report_type" AS ENUM ('PROMOTION', 'COMMENT');

-- CreateEnum
CREATE TYPE "report_status" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "type" "report_type" NOT NULL,
    "reporter_id" UUID NOT NULL,
    "reason" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "status" "report_status" NOT NULL DEFAULT 'PENDING',
    "action_notes" TEXT,
    "target_title" VARCHAR(255),
    "target_author_name" VARCHAR(120),
    "target_author_id" UUID,
    "promotion_id" UUID,
    "comment_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_status_created_at_idx" ON "reports"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reports_type_status_idx" ON "reports"("type", "status");

-- CreateIndex
CREATE INDEX "reports_promotion_id_idx" ON "reports"("promotion_id");

-- CreateIndex
CREATE INDEX "reports_comment_id_idx" ON "reports"("comment_id");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
