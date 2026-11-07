-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'weaver', 'merchant');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('assigned', 'in_progress', 'returned', 'reconciled', 'cancelled');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('draft', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "DirectTxnType" AS ENUM ('fabric_purchase_from_weaver', 'yarn_sale_to_weaver', 'fabric_sale_to_merchant');

-- CreateEnum
CREATE TYPE "DirectTxnStatus" AS ENUM ('unpaid', 'partially_paid', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "SettlementBatchStatus" AS ENUM ('draft', 'committed');

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "username" VARCHAR(60) NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(30),
    "email" VARCHAR(120),
    "password_hash" VARCHAR(200),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" INTEGER NOT NULL,
    "role" "UserRole" NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role")
);

-- CreateTable
CREATE TABLE "fabrics" (
    "fabric_id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "standard_length_cm" DECIMAL(10,2) NOT NULL,
    "standard_width_cm" DECIMAL(10,2) NOT NULL,
    "standard_weight_g" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "fabrics_pkey" PRIMARY KEY ("fabric_id")
);

-- CreateTable
CREATE TABLE "colors" (
    "color_id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "colors_pkey" PRIMARY KEY ("color_id")
);

-- CreateTable
CREATE TABLE "designs" (
    "design_id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,

    CONSTRAINT "designs_pkey" PRIMARY KEY ("design_id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "supplier_id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "contact_phone" VARCHAR(30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateTable
CREATE TABLE "yarns" (
    "yarn_id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "yarns_pkey" PRIMARY KEY ("yarn_id")
);

-- CreateTable
CREATE TABLE "fabric_variants" (
    "fabric_variant_id" SERIAL NOT NULL,
    "fabric_id" INTEGER NOT NULL,
    "design_id" INTEGER NOT NULL,
    "warp_color_id" INTEGER NOT NULL,
    "weft_color_id" INTEGER NOT NULL,
    "sku" VARCHAR(40) NOT NULL,
    "stock_snapshot" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fabric_variants_pkey" PRIMARY KEY ("fabric_variant_id")
);

-- CreateTable
CREATE TABLE "yarn_variants" (
    "yarn_variant_id" SERIAL NOT NULL,
    "yarn_id" INTEGER NOT NULL,
    "color_id" INTEGER NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "sku" VARCHAR(40) NOT NULL,
    "stock_snapshot" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "yarn_variants_pkey" PRIMARY KEY ("yarn_variant_id")
);

-- CreateTable
CREATE TABLE "fabric_prices" (
    "fabric_price_id" SERIAL NOT NULL,
    "fabric_id" INTEGER NOT NULL,
    "weaver_rate" DECIMAL(12,2) NOT NULL,
    "selling_price" DECIMAL(12,2) NOT NULL,
    "effective_from" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fabric_prices_pkey" PRIMARY KEY ("fabric_price_id")
);

-- CreateTable
CREATE TABLE "yarn_prices" (
    "yarn_price_id" SERIAL NOT NULL,
    "yarn_id" INTEGER NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "purchase_price" DECIMAL(12,2) NOT NULL,
    "selling_price" DECIMAL(12,2) NOT NULL,
    "effective_from" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yarn_prices_pkey" PRIMARY KEY ("yarn_price_id")
);

-- CreateTable
CREATE TABLE "quality_rules" (
    "quality_rule_id" SERIAL NOT NULL,
    "factor" VARCHAR(30) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "deduction_per_unit" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "quality_rules_pkey" PRIMARY KEY ("quality_rule_id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "zig_id" VARCHAR(20) NOT NULL,
    "weaver_user_id" INTEGER NOT NULL,
    "fabric_variant_id" INTEGER NOT NULL,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'assigned',
    "date_issued" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issued_by_user_id" INTEGER NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("zig_id")
);

-- CreateTable
CREATE TABLE "yarn_given" (
    "yarn_given_id" SERIAL NOT NULL,
    "zig_id" VARCHAR(20) NOT NULL,
    "yarn_variant_id" INTEGER NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "date_given" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_user_id" INTEGER NOT NULL,

    CONSTRAINT "yarn_given_pkey" PRIMARY KEY ("yarn_given_id")
);

-- CreateTable
CREATE TABLE "yarn_returns" (
    "yarn_return_id" SERIAL NOT NULL,
    "zig_id" VARCHAR(20) NOT NULL,
    "yarn_variant_id" INTEGER NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "date_returned" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_user_id" INTEGER NOT NULL,
    "remark" TEXT,

    CONSTRAINT "yarn_returns_pkey" PRIMARY KEY ("yarn_return_id")
);

-- CreateTable
CREATE TABLE "fabric_returns" (
    "return_id" SERIAL NOT NULL,
    "zig_id" VARCHAR(20) NOT NULL,
    "fabric_variant_id" INTEGER NOT NULL,
    "quantity_returned" INTEGER NOT NULL,
    "total_weight" DECIMAL(10,2) NOT NULL,
    "length_cm" DECIMAL(10,2),
    "width_cm" DECIMAL(10,2),
    "unit_price" DECIMAL(12,2) NOT NULL,
    "date_returned" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_user_id" INTEGER NOT NULL,
    "remark" TEXT,

    CONSTRAINT "fabric_returns_pkey" PRIMARY KEY ("return_id")
);

-- CreateTable
CREATE TABLE "fabric_returns_to_weavers" (
    "fabric_return_to_weaver_id" SERIAL NOT NULL,
    "zig_id" VARCHAR(20) NOT NULL,
    "fabric_variant_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "date_returned" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_user_id" INTEGER NOT NULL,
    "remark" TEXT,

    CONSTRAINT "fabric_returns_to_weavers_pkey" PRIMARY KEY ("fabric_return_to_weaver_id")
);

-- CreateTable
CREATE TABLE "yarn_purchases" (
    "purchase_id" SERIAL NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "purchase_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_user_id" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "yarn_purchases_pkey" PRIMARY KEY ("purchase_id")
);

-- CreateTable
CREATE TABLE "yarn_purchase_lines" (
    "line_id" SERIAL NOT NULL,
    "purchase_id" INTEGER NOT NULL,
    "yarn_variant_id" INTEGER NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "yarn_purchase_lines_pkey" PRIMARY KEY ("line_id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "settlement_id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "weaver_user_id" INTEGER NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'draft',
    "gross_fabric_value" DECIMAL(12,2) NOT NULL,
    "total_deductions" DECIMAL(12,2) NOT NULL,
    "total_yarn_cost" DECIMAL(12,2) NOT NULL,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "created_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMPTZ,
    "notes" TEXT,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("settlement_id")
);

-- CreateTable
CREATE TABLE "settlement_batches" (
    "batch_id" SERIAL NOT NULL,
    "status" "SettlementBatchStatus" NOT NULL DEFAULT 'draft',
    "snapshot" JSONB NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amount_paid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "committed_at" TIMESTAMPTZ,

    CONSTRAINT "settlement_batches_pkey" PRIMARY KEY ("batch_id")
);

-- CreateTable
CREATE TABLE "settlement_lines" (
    "settlement_line_id" SERIAL NOT NULL,
    "settlement_id" INTEGER NOT NULL,
    "zig_id" VARCHAR(20) NOT NULL,
    "fabric_id" INTEGER NOT NULL,
    "total_quantity" INTEGER NOT NULL,
    "total_weight" DECIMAL(10,2) NOT NULL,
    "average_weight" DECIMAL(10,2) NOT NULL,
    "standard_weight_g" DECIMAL(10,2) NOT NULL,
    "standard_length_cm" DECIMAL(10,2),
    "standard_width_cm" DECIMAL(10,2),
    "unit_price" DECIMAL(12,2) NOT NULL,
    "deduction_factor" VARCHAR(30) NOT NULL,
    "deduction_unit" VARCHAR(20) NOT NULL,
    "deduction_per_piece" DECIMAL(12,2) NOT NULL,
    "deduction_amount" DECIMAL(12,2) NOT NULL,
    "gross_fabric_value" DECIMAL(12,2) NOT NULL,
    "net_fabric_value" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "settlement_lines_pkey" PRIMARY KEY ("settlement_line_id")
);

-- CreateTable
CREATE TABLE "settlement_line_returns" (
    "settlement_line_id" INTEGER NOT NULL,
    "return_id" INTEGER NOT NULL,

    CONSTRAINT "settlement_line_returns_pkey" PRIMARY KEY ("settlement_line_id","return_id")
);

-- CreateTable
CREATE TABLE "settlement_yarn_lines" (
    "settlement_yarn_line_id" SERIAL NOT NULL,
    "settlement_id" INTEGER NOT NULL,
    "zig_id" VARCHAR(20) NOT NULL,
    "yarn_given_id" INTEGER NOT NULL,
    "yarn_variant_id" INTEGER NOT NULL,
    "issued_quantity" DECIMAL(10,2) NOT NULL,
    "returned_quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "net_quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total_cost" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "settlement_yarn_lines_pkey" PRIMARY KEY ("settlement_yarn_line_id")
);

-- CreateTable
CREATE TABLE "settlement_payments" (
    "settlement_payment_id" SERIAL NOT NULL,
    "settlement_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" VARCHAR(30),
    "payment_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_user_id" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "settlement_payments_pkey" PRIMARY KEY ("settlement_payment_id")
);

-- CreateTable
CREATE TABLE "direct_transactions" (
    "transaction_id" SERIAL NOT NULL,
    "type" "DirectTxnType" NOT NULL,
    "weaver_user_id" INTEGER,
    "merchant_user_id" INTEGER,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "amount_paid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "DirectTxnStatus" NOT NULL DEFAULT 'unpaid',
    "transaction_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_user_id" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "direct_transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "direct_transaction_lines" (
    "line_id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "fabric_variant_id" INTEGER,
    "yarn_variant_id" INTEGER,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,
    "description" VARCHAR(200),

    CONSTRAINT "direct_transaction_lines_pkey" PRIMARY KEY ("line_id")
);

-- CreateTable
CREATE TABLE "direct_transaction_payments" (
    "payment_id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" VARCHAR(30),
    "payment_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_user_id" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "direct_transaction_payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "audit_log_id" SERIAL NOT NULL,
    "actor_user_id" INTEGER NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" VARCHAR(80),
    "details" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("audit_log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "fabrics_name_key" ON "fabrics"("name");

-- CreateIndex
CREATE UNIQUE INDEX "colors_name_key" ON "colors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "designs_name_key" ON "designs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "yarns_name_key" ON "yarns"("name");

-- CreateIndex
CREATE UNIQUE INDEX "fabric_variants_sku_key" ON "fabric_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "yarn_variants_sku_key" ON "yarn_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "settlement_line_returns_return_id_key" ON "settlement_line_returns"("return_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_variants" ADD CONSTRAINT "fabric_variants_fabric_id_fkey" FOREIGN KEY ("fabric_id") REFERENCES "fabrics"("fabric_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_variants" ADD CONSTRAINT "fabric_variants_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "designs"("design_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_variants" ADD CONSTRAINT "fabric_variants_warp_color_id_fkey" FOREIGN KEY ("warp_color_id") REFERENCES "colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_variants" ADD CONSTRAINT "fabric_variants_weft_color_id_fkey" FOREIGN KEY ("weft_color_id") REFERENCES "colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_variants" ADD CONSTRAINT "yarn_variants_yarn_id_fkey" FOREIGN KEY ("yarn_id") REFERENCES "yarns"("yarn_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_variants" ADD CONSTRAINT "yarn_variants_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_variants" ADD CONSTRAINT "yarn_variants_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_prices" ADD CONSTRAINT "fabric_prices_fabric_id_fkey" FOREIGN KEY ("fabric_id") REFERENCES "fabrics"("fabric_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_prices" ADD CONSTRAINT "yarn_prices_yarn_id_fkey" FOREIGN KEY ("yarn_id") REFERENCES "yarns"("yarn_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_prices" ADD CONSTRAINT "yarn_prices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_weaver_user_id_fkey" FOREIGN KEY ("weaver_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_fabric_variant_id_fkey" FOREIGN KEY ("fabric_variant_id") REFERENCES "fabric_variants"("fabric_variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_issued_by_user_id_fkey" FOREIGN KEY ("issued_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_given" ADD CONSTRAINT "yarn_given_zig_id_fkey" FOREIGN KEY ("zig_id") REFERENCES "work_orders"("zig_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_given" ADD CONSTRAINT "yarn_given_yarn_variant_id_fkey" FOREIGN KEY ("yarn_variant_id") REFERENCES "yarn_variants"("yarn_variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_given" ADD CONSTRAINT "yarn_given_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_returns" ADD CONSTRAINT "yarn_returns_zig_id_fkey" FOREIGN KEY ("zig_id") REFERENCES "work_orders"("zig_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_returns" ADD CONSTRAINT "yarn_returns_yarn_variant_id_fkey" FOREIGN KEY ("yarn_variant_id") REFERENCES "yarn_variants"("yarn_variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_returns" ADD CONSTRAINT "yarn_returns_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_returns" ADD CONSTRAINT "fabric_returns_zig_id_fkey" FOREIGN KEY ("zig_id") REFERENCES "work_orders"("zig_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_returns" ADD CONSTRAINT "fabric_returns_fabric_variant_id_fkey" FOREIGN KEY ("fabric_variant_id") REFERENCES "fabric_variants"("fabric_variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_returns" ADD CONSTRAINT "fabric_returns_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_returns_to_weavers" ADD CONSTRAINT "fabric_returns_to_weavers_zig_id_fkey" FOREIGN KEY ("zig_id") REFERENCES "work_orders"("zig_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_returns_to_weavers" ADD CONSTRAINT "fabric_returns_to_weavers_fabric_variant_id_fkey" FOREIGN KEY ("fabric_variant_id") REFERENCES "fabric_variants"("fabric_variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_returns_to_weavers" ADD CONSTRAINT "fabric_returns_to_weavers_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_purchases" ADD CONSTRAINT "yarn_purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_purchases" ADD CONSTRAINT "yarn_purchases_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_purchase_lines" ADD CONSTRAINT "yarn_purchase_lines_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "yarn_purchases"("purchase_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_purchase_lines" ADD CONSTRAINT "yarn_purchase_lines_yarn_variant_id_fkey" FOREIGN KEY ("yarn_variant_id") REFERENCES "yarn_variants"("yarn_variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "settlement_batches"("batch_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_weaver_user_id_fkey" FOREIGN KEY ("weaver_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_batches" ADD CONSTRAINT "settlement_batches_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_lines" ADD CONSTRAINT "settlement_lines_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("settlement_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_lines" ADD CONSTRAINT "settlement_lines_zig_id_fkey" FOREIGN KEY ("zig_id") REFERENCES "work_orders"("zig_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_lines" ADD CONSTRAINT "settlement_lines_fabric_id_fkey" FOREIGN KEY ("fabric_id") REFERENCES "fabrics"("fabric_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_line_returns" ADD CONSTRAINT "settlement_line_returns_settlement_line_id_fkey" FOREIGN KEY ("settlement_line_id") REFERENCES "settlement_lines"("settlement_line_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_line_returns" ADD CONSTRAINT "settlement_line_returns_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "fabric_returns"("return_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_yarn_lines" ADD CONSTRAINT "settlement_yarn_lines_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("settlement_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_yarn_lines" ADD CONSTRAINT "settlement_yarn_lines_zig_id_fkey" FOREIGN KEY ("zig_id") REFERENCES "work_orders"("zig_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_yarn_lines" ADD CONSTRAINT "settlement_yarn_lines_yarn_given_id_fkey" FOREIGN KEY ("yarn_given_id") REFERENCES "yarn_given"("yarn_given_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_yarn_lines" ADD CONSTRAINT "settlement_yarn_lines_yarn_variant_id_fkey" FOREIGN KEY ("yarn_variant_id") REFERENCES "yarn_variants"("yarn_variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_payments" ADD CONSTRAINT "settlement_payments_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("settlement_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_payments" ADD CONSTRAINT "settlement_payments_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_transactions" ADD CONSTRAINT "direct_transactions_weaver_user_id_fkey" FOREIGN KEY ("weaver_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_transactions" ADD CONSTRAINT "direct_transactions_merchant_user_id_fkey" FOREIGN KEY ("merchant_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_transactions" ADD CONSTRAINT "direct_transactions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_transaction_lines" ADD CONSTRAINT "direct_transaction_lines_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "direct_transactions"("transaction_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_transaction_lines" ADD CONSTRAINT "direct_transaction_lines_fabric_variant_id_fkey" FOREIGN KEY ("fabric_variant_id") REFERENCES "fabric_variants"("fabric_variant_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_transaction_lines" ADD CONSTRAINT "direct_transaction_lines_yarn_variant_id_fkey" FOREIGN KEY ("yarn_variant_id") REFERENCES "yarn_variants"("yarn_variant_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_transaction_payments" ADD CONSTRAINT "direct_transaction_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "direct_transactions"("transaction_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_transaction_payments" ADD CONSTRAINT "direct_transaction_payments_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

