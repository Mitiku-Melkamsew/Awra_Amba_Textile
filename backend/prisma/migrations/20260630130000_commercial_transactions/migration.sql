-- CreateEnum
CREATE TYPE "CommercialTxnType" AS ENUM ('yarn_purchase', 'fabric_purchase', 'yarn_sale', 'fabric_sale', 'weaver_payout');
CREATE TYPE "CommercialTxnStatus" AS ENUM ('pending', 'in_progress', 'awaiting_delivery', 'awaiting_payment', 'completed', 'cancelled');
CREATE TYPE "PaymentTerms" AS ENUM ('prepaid', 'on_delivery', 'installment');

-- CreateTable
CREATE TABLE "commercial_transactions" (
    "transaction_id" VARCHAR(24) NOT NULL,
    "type" "CommercialTxnType" NOT NULL,
    "status" "CommercialTxnStatus" NOT NULL DEFAULT 'pending',
    "payment_terms" "PaymentTerms" NOT NULL,
    "supplier_id" INTEGER,
    "weaver_id" INTEGER,
    "merchant_id" INTEGER,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amount_paid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "delivered_at" TIMESTAMPTZ,
    "notes" TEXT,
    "linked_payment_id" INTEGER,
    "created_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commercial_transactions_pkey" PRIMARY KEY ("transaction_id")
);

CREATE TABLE "commercial_transaction_lines" (
    "line_id" SERIAL NOT NULL,
    "transaction_id" VARCHAR(24) NOT NULL,
    "yarn_variant_id" INTEGER,
    "fabric_variant_id" INTEGER,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "delivered_quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "description" VARCHAR(200),

    CONSTRAINT "commercial_transaction_lines_pkey" PRIMARY KEY ("line_id")
);

CREATE TABLE "commercial_transaction_payments" (
    "installment_id" SERIAL NOT NULL,
    "transaction_id" VARCHAR(24) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" VARCHAR(30),
    "notes" TEXT,
    "recorded_by_user_id" INTEGER NOT NULL,

    CONSTRAINT "commercial_transaction_payments_pkey" PRIMARY KEY ("installment_id")
);

CREATE UNIQUE INDEX "commercial_transactions_linked_payment_id_key" ON "commercial_transactions"("linked_payment_id");

ALTER TABLE "commercial_transactions" ADD CONSTRAINT "commercial_transactions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commercial_transactions" ADD CONSTRAINT "commercial_transactions_weaver_id_fkey" FOREIGN KEY ("weaver_id") REFERENCES "weavers"("weaver_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commercial_transactions" ADD CONSTRAINT "commercial_transactions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("merchant_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commercial_transactions" ADD CONSTRAINT "commercial_transactions_linked_payment_id_fkey" FOREIGN KEY ("linked_payment_id") REFERENCES "payments"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commercial_transactions" ADD CONSTRAINT "commercial_transactions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "commercial_transaction_lines" ADD CONSTRAINT "commercial_transaction_lines_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "commercial_transactions"("transaction_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commercial_transaction_lines" ADD CONSTRAINT "commercial_transaction_lines_yarn_variant_id_fkey" FOREIGN KEY ("yarn_variant_id") REFERENCES "yarn_variants"("yarn_variant_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commercial_transaction_lines" ADD CONSTRAINT "commercial_transaction_lines_fabric_variant_id_fkey" FOREIGN KEY ("fabric_variant_id") REFERENCES "fabric_variants"("fabric_variant_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "commercial_transaction_payments" ADD CONSTRAINT "commercial_transaction_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "commercial_transactions"("transaction_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commercial_transaction_payments" ADD CONSTRAINT "commercial_transaction_payments_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "commercial_transaction_lines" ADD CONSTRAINT "commercial_line_one_variant" CHECK (
  (yarn_variant_id IS NOT NULL)::int + (fabric_variant_id IS NOT NULL)::int <= 1
);