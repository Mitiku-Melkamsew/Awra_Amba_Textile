-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('yarn', 'fabric', 'garment');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'weaver', 'merchant');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('assigned', 'in_progress', 'returned', 'reconciled');

-- CreateEnum
CREATE TYPE "SaleMovementType" AS ENUM ('merchant_fabric_sale', 'weaver_yarn_sale', 'weaver_fabric_purchase', 'adjustment');

-- CreateTable
CREATE TABLE "products" (
    "product_id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "base_price" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "colors" (
    "color_id" SERIAL NOT NULL,
    "color_code" VARCHAR(10) NOT NULL,
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
CREATE TABLE "yarn_types" (
    "yarn_type_id" SERIAL NOT NULL,
    "material_name" VARCHAR(80) NOT NULL,

    CONSTRAINT "yarn_types_pkey" PRIMARY KEY ("yarn_type_id")
);

-- CreateTable
CREATE TABLE "fabric_variants" (
    "fabric_variant_id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "design_id" INTEGER,
    "warp_color_id" INTEGER NOT NULL,
    "weft_color_id" INTEGER NOT NULL,
    "base_price" DECIMAL(12,2),
    "sku" VARCHAR(40) NOT NULL,
    "stock_snapshot" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fabric_variants_pkey" PRIMARY KEY ("fabric_variant_id")
);

-- CreateTable
CREATE TABLE "yarn_variants" (
    "yarn_variant_id" SERIAL NOT NULL,
    "yarn_type_id" INTEGER NOT NULL,
    "color_id" INTEGER NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "base_price" DECIMAL(12,2),
    "sku" VARCHAR(40) NOT NULL,
    "stock_snapshot" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "yarn_variants_pkey" PRIMARY KEY ("yarn_variant_id")
);

-- CreateTable
CREATE TABLE "quality_rules" (
    "quality_rule_id" SERIAL NOT NULL,
    "fabric_variant_id" INTEGER NOT NULL,
    "min_weight_threshold" DECIMAL(10,2) NOT NULL,
    "deduction_rate_per_unit" DECIMAL(10,2) NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "quality_rules_pkey" PRIMARY KEY ("quality_rule_id")
);

-- CreateTable
CREATE TABLE "bonus_rules" (
    "bonus_rule_id" SERIAL NOT NULL,
    "fabric_variant_id" INTEGER NOT NULL,
    "min_weight_threshold" DECIMAL(10,2) NOT NULL,
    "bonus_rate_per_unit" DECIMAL(10,2) NOT NULL DEFAULT 10,
    "max_bonus_per_piece" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bonus_rules_pkey" PRIMARY KEY ("bonus_rule_id")
);

-- CreateTable
CREATE TABLE "weavers" (
    "weaver_id" SERIAL NOT NULL,
    "first_name" VARCHAR(80) NOT NULL,
    "last_name" VARCHAR(80) NOT NULL,
    "phone" VARCHAR(30),
    "email" VARCHAR(120),
    "bank_account_number" VARCHAR(40),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "weavers_pkey" PRIMARY KEY ("weaver_id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "merchant_id" SERIAL NOT NULL,
    "company_name" VARCHAR(120),
    "contact_phone" VARCHAR(30) NOT NULL,
    "contact_email" VARCHAR(120),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("merchant_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "username" VARCHAR(60) NOT NULL,
    "password_hash" VARCHAR(200),
    "role" "UserRole" NOT NULL,
    "weaver_id" INTEGER,
    "merchant_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
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
CREATE TABLE "supplier_payments" (
    "payment_id" SERIAL NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" VARCHAR(30),
    "payment_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_user_id" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "zig_id" VARCHAR(20) NOT NULL,
    "weaver_id" INTEGER NOT NULL,
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
    "payment_id" INTEGER,

    CONSTRAINT "yarn_given_pkey" PRIMARY KEY ("yarn_given_id")
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
    "calculated_deduction" DECIMAL(12,2),
    "bonus_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_credit_value" DECIMAL(12,2),
    "remark" TEXT,
    "payment_id" INTEGER,

    CONSTRAINT "fabric_returns_pkey" PRIMARY KEY ("return_id")
);

-- CreateTable
CREATE TABLE "sales" (
    "sale_id" SERIAL NOT NULL,
    "fabric_variant_id" INTEGER,
    "yarn_variant_id" INTEGER,
    "merchant_id" INTEGER,
    "weaver_id" INTEGER,
    "movement_type" "SaleMovementType" NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "sale_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_user_id" INTEGER NOT NULL,
    "payment_id" INTEGER,
    "notes" TEXT,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("sale_id")
);

-- CreateTable
CREATE TABLE "payments" (
    "payment_id" SERIAL NOT NULL,
    "weaver_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" VARCHAR(30),
    "payment_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_user_id" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "merchant_payments" (
    "payment_id" SERIAL NOT NULL,
    "merchant_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" VARCHAR(30),
    "payment_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_user_id" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "merchant_payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "colors_color_code_key" ON "colors"("color_code");

-- CreateIndex
CREATE UNIQUE INDEX "colors_name_key" ON "colors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "designs_name_key" ON "designs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "yarn_types_material_name_key" ON "yarn_types"("material_name");

-- CreateIndex
CREATE UNIQUE INDEX "fabric_variants_sku_key" ON "fabric_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "yarn_variants_sku_key" ON "yarn_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "quality_rules_fabric_variant_id_key" ON "quality_rules"("fabric_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "bonus_rules_fabric_variant_id_key" ON "bonus_rules"("fabric_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_weaver_id_key" ON "users"("weaver_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_merchant_id_key" ON "users"("merchant_id");

-- AddForeignKey
ALTER TABLE "fabric_variants" ADD CONSTRAINT "fabric_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_variants" ADD CONSTRAINT "fabric_variants_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "designs"("design_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_variants" ADD CONSTRAINT "fabric_variants_warp_color_id_fkey" FOREIGN KEY ("warp_color_id") REFERENCES "colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_variants" ADD CONSTRAINT "fabric_variants_weft_color_id_fkey" FOREIGN KEY ("weft_color_id") REFERENCES "colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_variants" ADD CONSTRAINT "yarn_variants_yarn_type_id_fkey" FOREIGN KEY ("yarn_type_id") REFERENCES "yarn_types"("yarn_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_variants" ADD CONSTRAINT "yarn_variants_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_variants" ADD CONSTRAINT "yarn_variants_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_rules" ADD CONSTRAINT "quality_rules_fabric_variant_id_fkey" FOREIGN KEY ("fabric_variant_id") REFERENCES "fabric_variants"("fabric_variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_rules" ADD CONSTRAINT "bonus_rules_fabric_variant_id_fkey" FOREIGN KEY ("fabric_variant_id") REFERENCES "fabric_variants"("fabric_variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_weaver_id_fkey" FOREIGN KEY ("weaver_id") REFERENCES "weavers"("weaver_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("merchant_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_purchases" ADD CONSTRAINT "yarn_purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_purchases" ADD CONSTRAINT "yarn_purchases_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_purchase_lines" ADD CONSTRAINT "yarn_purchase_lines_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "yarn_purchases"("purchase_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_purchase_lines" ADD CONSTRAINT "yarn_purchase_lines_yarn_variant_id_fkey" FOREIGN KEY ("yarn_variant_id") REFERENCES "yarn_variants"("yarn_variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_weaver_id_fkey" FOREIGN KEY ("weaver_id") REFERENCES "weavers"("weaver_id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "yarn_given" ADD CONSTRAINT "yarn_given_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_returns" ADD CONSTRAINT "fabric_returns_zig_id_fkey" FOREIGN KEY ("zig_id") REFERENCES "work_orders"("zig_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_returns" ADD CONSTRAINT "fabric_returns_fabric_variant_id_fkey" FOREIGN KEY ("fabric_variant_id") REFERENCES "fabric_variants"("fabric_variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_returns" ADD CONSTRAINT "fabric_returns_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_returns" ADD CONSTRAINT "fabric_returns_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_fabric_variant_id_fkey" FOREIGN KEY ("fabric_variant_id") REFERENCES "fabric_variants"("fabric_variant_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_yarn_variant_id_fkey" FOREIGN KEY ("yarn_variant_id") REFERENCES "yarn_variants"("yarn_variant_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("merchant_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_weaver_id_fkey" FOREIGN KEY ("weaver_id") REFERENCES "weavers"("weaver_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_weaver_id_fkey" FOREIGN KEY ("weaver_id") REFERENCES "weavers"("weaver_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_payments" ADD CONSTRAINT "merchant_payments_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("merchant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_payments" ADD CONSTRAINT "merchant_payments_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
