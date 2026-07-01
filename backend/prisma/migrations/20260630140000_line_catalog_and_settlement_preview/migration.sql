-- AlterTable commercial_transaction_lines
ALTER TABLE "commercial_transaction_lines" ADD COLUMN "yarn_type_id" INTEGER;
ALTER TABLE "commercial_transaction_lines" ADD COLUMN "color_id" INTEGER;
ALTER TABLE "commercial_transaction_lines" ADD COLUMN "supplier_id" INTEGER;
ALTER TABLE "commercial_transaction_lines" ADD COLUMN "product_id" INTEGER;
ALTER TABLE "commercial_transaction_lines" ADD COLUMN "warp_color_id" INTEGER;
ALTER TABLE "commercial_transaction_lines" ADD COLUMN "weft_color_id" INTEGER;
ALTER TABLE "commercial_transaction_lines" ADD COLUMN "design_id" INTEGER;

-- CreateEnum
CREATE TYPE "SettlementPreviewStatus" AS ENUM ('draft', 'committed');

-- CreateTable
CREATE TABLE "settlement_previews" (
    "preview_id" VARCHAR(24) NOT NULL,
    "status" "SettlementPreviewStatus" NOT NULL DEFAULT 'draft',
    "snapshot" JSONB NOT NULL,
    "created_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "committed_at" TIMESTAMPTZ,

    CONSTRAINT "settlement_previews_pkey" PRIMARY KEY ("preview_id")
);

ALTER TABLE "payments" ADD COLUMN "settlement_preview_id" VARCHAR(24);

ALTER TABLE "settlement_previews" ADD CONSTRAINT "settlement_previews_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_settlement_preview_id_fkey" FOREIGN KEY ("settlement_preview_id") REFERENCES "settlement_previews"("preview_id") ON DELETE SET NULL ON UPDATE CASCADE;