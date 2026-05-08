-- CreateEnum
CREATE TYPE "SleeveLength" AS ENUM ('sleeveless', 'cap', 'short', 'elbow', 'three_quarter', 'long', 'extra_long');

-- CreateEnum
CREATE TYPE "Neckline" AS ENUM ('crew', 'v_neck', 'scoop', 'high_neck', 'turtleneck', 'off_shoulder', 'halter', 'square');

-- CreateEnum
CREATE TYPE "BackStyle" AS ENUM ('closed', 'scoop_back', 'v_back', 'low_back', 'open_back');

-- CreateEnum
CREATE TYPE "HemLength" AS ENUM ('mini', 'knee', 'midi', 'ankle', 'floor');

-- CreateEnum
CREATE TYPE "TopLength" AS ENUM ('cropped', 'waist', 'hip', 'tunic', 'longline');

-- CreateEnum
CREATE TYPE "Slit" AS ENUM ('none', 'low', 'mid', 'high');

-- CreateEnum
CREATE TYPE "Fit" AS ENUM ('fitted', 'semi_fitted', 'loose', 'oversized');

-- CreateEnum
CREATE TYPE "Opacity" AS ENUM ('sheer', 'semi_sheer', 'opaque');

-- CreateEnum
CREATE TYPE "Lined" AS ENUM ('lined', 'partially_lined', 'unlined');

-- CreateEnum
CREATE TYPE "Cutouts" AS ENUM ('none', 'present');

-- CreateEnum
CREATE TYPE "Material" AS ENUM ('cotton', 'linen', 'silk', 'polyester', 'viscose', 'modal', 'wool', 'denim', 'leather', 'knit', 'blend', 'other');

-- CreateEnum
CREATE TYPE "PrimaryColor" AS ENUM ('black', 'white', 'beige', 'brown', 'gray', 'navy', 'blue', 'green', 'yellow', 'orange', 'red', 'pink', 'purple', 'multicolor');

-- CreateEnum
CREATE TYPE "Pattern" AS ENUM ('solid', 'striped', 'floral', 'plaid', 'geometric', 'animal_print', 'polka_dot', 'abstract', 'other');

-- CreateEnum
CREATE TYPE "TagStatus" AS ENUM ('pending', 'tagged', 'failed', 'needs_review');

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website_url" TEXT NOT NULL,
    "affiliate_program" TEXT NOT NULL,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "affiliate_url" TEXT NOT NULL,
    "in_stock" BOOLEAN NOT NULL,
    "last_verified_at" TIMESTAMP(3) NOT NULL,
    "tag_status" "TagStatus" NOT NULL DEFAULT 'pending',
    "tag_confidence" DECIMAL(3,2),
    "tagged_at" TIMESTAMP(3),
    "sleeve_length" "SleeveLength",
    "sleeve_opacity" "Opacity",
    "neckline" "Neckline",
    "back_style" "BackStyle",
    "hem_length" "HemLength",
    "top_length" "TopLength",
    "slit" "Slit",
    "fit" "Fit",
    "opacity" "Opacity",
    "lined" "Lined",
    "cutouts" "Cutouts",
    "material" "Material",
    "primary_color" "PrimaryColor",
    "pattern" "Pattern",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "products_brand_id_idx" ON "products"("brand_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_tag_status_idx" ON "products"("tag_status");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
