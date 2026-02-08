-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('POS_ACCESS', 'MANAGE_PRODUCTS', 'MANAGE_INVENTORY', 'VIEW_COST_PRICE', 'VIEW_ANALYTICS');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('simple', 'variable', 'service');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('import', 'export', 'return', 'writeOff', 'adjustment', 'debt', 'repayment', 'exchange', 'internal_use', 'transfer_in', 'transfer_out', 'supplier_return');

-- CreateEnum
CREATE TYPE "InventoryAllocationReference" AS ENUM ('transaction', 'order', 'reservation', 'adjustment', 'manual');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'card', 'transfer', 'mobile', 'voucher');

-- CreateEnum
CREATE TYPE "WriteOffReason" AS ENUM ('theft', 'damage', 'expiry', 'defect', 'other');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "CounterpartyType" AS ENUM ('customer', 'supplier', 'both');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "subscription_id" TEXT,
    "subscription_status" "SubscriptionStatus" DEFAULT 'incomplete',
    "subscription_ends_at" TIMESTAMP(3),
    "owner_id" TEXT NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "push_token" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_organizations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "store_id" TEXT,
    "role" "Role" NOT NULL DEFAULT 'user',
    "permissions" "Permission"[],
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "transaction_view_limit_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polar_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "checkout_id" TEXT,
    "checkout_client_secret" TEXT,
    "polar_customer_id" TEXT,
    "amount_cents" INTEGER,
    "currency" TEXT DEFAULT 'usd',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polar_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_schema_registry" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "schema_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "migrated_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "_schema_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "store_id" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "currency" TEXT,
    "loyalty_cashback_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "address" TEXT,
    "phone" TEXT,
    "transaction_view_limit_days" INTEGER NOT NULL DEFAULT 7,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#4fc3f7',
    "store_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,
    "product_category_id" TEXT,
    "organization_id" TEXT NOT NULL,
    "store_id" TEXT,
    "user_id" TEXT,
    "type" "ProductType" NOT NULL DEFAULT 'simple',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "barcode" TEXT NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(15,2) NOT NULL,
    "selling_price" DECIMAL(15,2) NOT NULL,
    "supplier_price" DECIMAL(15,2) NOT NULL,
    "unit_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "store_id" TEXT,
    "image_url" TEXT,
    "color" TEXT DEFAULT '#4fc3f7',
    "supplier_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_variations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "product_variation_id" TEXT NOT NULL,
    "quantity_in_stock" INTEGER NOT NULL,
    "store_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_batches" (
    "id" TEXT NOT NULL,
    "product_variation_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "batch_code" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cost_price" DECIMAL(15,2) NOT NULL,
    "supplier_price" DECIMAL(15,2),
    "quantity_received" INTEGER NOT NULL,
    "quantity_remaining" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_batch_allocations" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "reference_type" "InventoryAllocationReference" NOT NULL,
    "reference_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_batch_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "language" TEXT DEFAULT 'uz',
    "gender" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "social_links" JSONB,
    "organization_id" TEXT NOT NULL,
    "store_id" TEXT,
    "counterparty_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "product_variation_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "selling_price" DECIMAL(15,2) NOT NULL,
    "supplier_price" DECIMAL(15,2) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "customer_id" TEXT,
    "store_id" TEXT NOT NULL,
    "user_id" TEXT,
    "payment_method" "PaymentMethod",
    "supplier_id" TEXT,
    "supplier_order_id" TEXT,
    "counterparty_id" TEXT,
    "loyalty_points_earned" INTEGER NOT NULL DEFAULT 0,
    "loyalty_points_redeemed" INTEGER NOT NULL DEFAULT 0,
    "loyalty_discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "group_id" TEXT,
    "original_transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "payment_method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "collected_by_id" TEXT,
    "webhook_data" JSONB,
    "error_message" TEXT,
    "received_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "order_id" TEXT,
    "payer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_cards" (
    "id" TEXT NOT NULL,
    "card_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "inn" TEXT,
    "bank_account" TEXT,
    "mfo" TEXT,
    "bank_name" TEXT,
    "director_name" TEXT,
    "organization_id" TEXT NOT NULL,
    "store_id" TEXT,
    "counterparty_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_payments" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "supplier_order_id" TEXT,
    "store_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'cash',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "write_offs" (
    "id" TEXT NOT NULL,
    "product_variation_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" "WriteOffReason" NOT NULL,
    "notes" TEXT,
    "write_off_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "write_offs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_audits" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "audit_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "AuditStatus" NOT NULL DEFAULT 'in_progress',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_audit_items" (
    "id" TEXT NOT NULL,
    "inventory_audit_id" TEXT NOT NULL,
    "product_variation_id" TEXT NOT NULL,
    "expected_quantity" INTEGER NOT NULL,
    "actual_quantity" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_audit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "product_variation_id" TEXT NOT NULL,
    "old_price" DECIMAL(15,2) NOT NULL,
    "new_price" DECIMAL(15,2) NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counterparties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "type" "CounterpartyType" NOT NULL,
    "store_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counterparties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "store_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricelists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pricelists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricelist_items" (
    "id" TEXT NOT NULL,
    "pricelist_id" TEXT NOT NULL,
    "product_variation_id" TEXT NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "min_quantity" INTEGER NOT NULL DEFAULT 1,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricelist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_owner_id_key" ON "organizations"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_organizations_user_id_idx" ON "user_organizations"("user_id");

-- CreateIndex
CREATE INDEX "user_organizations_organization_id_idx" ON "user_organizations"("organization_id");

-- CreateIndex
CREATE INDEX "user_organizations_store_id_idx" ON "user_organizations"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_organizations_user_id_organization_id_store_id_key" ON "user_organizations"("user_id", "organization_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "_schema_registry_organization_id_key" ON "_schema_registry"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "_schema_registry_schema_name_key" ON "_schema_registry"("schema_name");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_product_variation_id_store_id_key" ON "inventory"("product_variation_id", "store_id");

-- CreateIndex
CREATE INDEX "inventory_batches_product_variation_id_store_id_idx" ON "inventory_batches"("product_variation_id", "store_id");

-- CreateIndex
CREATE INDEX "inventory_batch_allocations_reference_type_reference_id_idx" ON "inventory_batch_allocations"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "transactions_store_id_transaction_date_idx" ON "transactions"("store_id", "transaction_date");

-- CreateIndex
CREATE INDEX "transactions_group_id_idx" ON "transactions"("group_id");

-- CreateIndex
CREATE INDEX "payments_transaction_id_idx" ON "payments"("transaction_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_collected_by_id_idx" ON "payments"("collected_by_id");

-- CreateIndex
CREATE INDEX "payments_payer_id_idx" ON "payments"("payer_id");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_cards_customer_id_key" ON "loyalty_cards"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_audit_items_inventory_audit_id_product_variation__key" ON "inventory_audit_items"("inventory_audit_id", "product_variation_id");

-- CreateIndex
CREATE INDEX "taxes_store_id_idx" ON "taxes"("store_id");

-- CreateIndex
CREATE INDEX "pricelists_store_id_idx" ON "pricelists"("store_id");

-- CreateIndex
CREATE INDEX "pricelist_items_pricelist_id_idx" ON "pricelist_items"("pricelist_id");

-- CreateIndex
CREATE INDEX "pricelist_items_product_variation_id_idx" ON "pricelist_items"("product_variation_id");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polar_orders" ADD CONSTRAINT "polar_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_product_category_id_fkey" FOREIGN KEY ("product_category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variations" ADD CONSTRAINT "product_variations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variations" ADD CONSTRAINT "product_variations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variations" ADD CONSTRAINT "product_variations_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variations" ADD CONSTRAINT "product_variations_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_variation_id_fkey" FOREIGN KEY ("product_variation_id") REFERENCES "product_variations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_product_variation_id_fkey" FOREIGN KEY ("product_variation_id") REFERENCES "product_variations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batch_allocations" ADD CONSTRAINT "inventory_batch_allocations_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "inventory_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "counterparties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "counterparties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_product_variation_id_fkey" FOREIGN KEY ("product_variation_id") REFERENCES "product_variations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_original_transaction_id_fkey" FOREIGN KEY ("original_transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_cards" ADD CONSTRAINT "loyalty_cards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "counterparties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "write_offs" ADD CONSTRAINT "write_offs_product_variation_id_fkey" FOREIGN KEY ("product_variation_id") REFERENCES "product_variations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "write_offs" ADD CONSTRAINT "write_offs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_audits" ADD CONSTRAINT "inventory_audits_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_audit_items" ADD CONSTRAINT "inventory_audit_items_inventory_audit_id_fkey" FOREIGN KEY ("inventory_audit_id") REFERENCES "inventory_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_audit_items" ADD CONSTRAINT "inventory_audit_items_product_variation_id_fkey" FOREIGN KEY ("product_variation_id") REFERENCES "product_variations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_product_variation_id_fkey" FOREIGN KEY ("product_variation_id") REFERENCES "product_variations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counterparties" ADD CONSTRAINT "counterparties_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricelists" ADD CONSTRAINT "pricelists_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricelist_items" ADD CONSTRAINT "pricelist_items_pricelist_id_fkey" FOREIGN KEY ("pricelist_id") REFERENCES "pricelists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricelist_items" ADD CONSTRAINT "pricelist_items_product_variation_id_fkey" FOREIGN KEY ("product_variation_id") REFERENCES "product_variations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
