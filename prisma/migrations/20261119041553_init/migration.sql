-- CreateEnum
CREATE TYPE "user_preference" AS ENUM ('STUDENT', 'HOUSEWIFE', 'WORKER', 'MSME_OWNER', 'GENERAL');

-- CreateEnum
CREATE TYPE "store_type" AS ENUM ('TRADITIONAL_MARKET', 'SUPERMARKET', 'LOCAL_STORE', 'MINIMARKET', 'FRUIT_VEGETABLE_STORE');

-- CreateEnum
CREATE TYPE "promotion_status" AS ENUM ('ACTIVE', 'VERIFIED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "stock_condition" AS ENUM ('PLENTY', 'LIMITED', 'LOW');

-- CreateEnum
CREATE TYPE "validation_type" AS ENUM ('VALID', 'INVALID', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "avatar_url" TEXT,
    "preference" "user_preference" NOT NULL DEFAULT 'GENERAL',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "store_type" "store_type" NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "product_name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "normal_price" INTEGER NOT NULL,
    "discount_price" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "stock_condition" "stock_condition" NOT NULL DEFAULT 'PLENTY',
    "starts_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "promotion_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_validations" (
    "id" UUID NOT NULL,
    "promotion_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "validation_type" "validation_type" NOT NULL,
    "note" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "promotion_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_validation_logs" (
    "id" UUID NOT NULL,
    "promotion_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "validation_type" "validation_type",
    "previous_type" "validation_type",
    "note" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_validation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "promotion_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_bookmarks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "promotion_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "stores_latitude_longitude_idx" ON "stores"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "stores_store_type_latitude_longitude_idx" ON "stores"("store_type", "latitude", "longitude");

-- CreateIndex
CREATE INDEX "stores_created_by_user_id_idx" ON "stores"("created_by_user_id");

-- CreateIndex
CREATE INDEX "promotions_status_ends_at_idx" ON "promotions"("status", "ends_at" DESC);

-- CreateIndex
CREATE INDEX "promotions_category_id_status_created_at_idx" ON "promotions"("category_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "promotions_store_id_status_idx" ON "promotions"("store_id", "status");

-- CreateIndex
CREATE INDEX "promotions_created_by_user_id_created_at_idx" ON "promotions"("created_by_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "promotion_validations_promotion_id_validation_type_idx" ON "promotion_validations"("promotion_id", "validation_type");

-- CreateIndex
CREATE INDEX "promotion_validations_user_id_idx" ON "promotion_validations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_validations_promotion_id_user_id_key" ON "promotion_validations"("promotion_id", "user_id");

-- CreateIndex
CREATE INDEX "promotion_validation_logs_promotion_id_created_at_idx" ON "promotion_validation_logs"("promotion_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "promotion_validation_logs_user_id_created_at_idx" ON "promotion_validation_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "comments_promotion_id_created_at_idx" ON "comments"("promotion_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "user_bookmarks_user_id_created_at_idx" ON "user_bookmarks"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_bookmarks_promotion_id_idx" ON "user_bookmarks"("promotion_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_bookmarks_user_id_promotion_id_key" ON "user_bookmarks"("user_id", "promotion_id");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_validations" ADD CONSTRAINT "promotion_validations_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_validations" ADD CONSTRAINT "promotion_validations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_validation_logs" ADD CONSTRAINT "promotion_validation_logs_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_validation_logs" ADD CONSTRAINT "promotion_validation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
