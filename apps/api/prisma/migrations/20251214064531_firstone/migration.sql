/*
  Warnings:

  - You are about to drop the column `counterparty_id` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `counterparty_id` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `counterparty_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `is_default` on the `units` table. All the data in the column will be lost.
  - You are about to drop the `_schema_registry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `counterparties` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `store` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `user_organizations` will be added. If there are existing duplicate values, this will fail.
  - Made the column `store_id` on table `user_organizations` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "counterparties" DROP CONSTRAINT "counterparties_store_id_fkey";

-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_counterparty_id_fkey";

-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_store_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory" DROP CONSTRAINT "inventory_store_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_audits" DROP CONSTRAINT "inventory_audits_store_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_batches" DROP CONSTRAINT "inventory_batches_store_id_fkey";

-- DropForeignKey
ALTER TABLE "polar_orders" DROP CONSTRAINT "polar_orders_user_id_fkey";

-- DropForeignKey
ALTER TABLE "pricelists" DROP CONSTRAINT "pricelists_store_id_fkey";

-- DropForeignKey
ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_store_id_fkey";

-- DropForeignKey
ALTER TABLE "product_variations" DROP CONSTRAINT "product_variations_store_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_store_id_fkey";

-- DropForeignKey
ALTER TABLE "supplier_payments" DROP CONSTRAINT "supplier_payments_store_id_fkey";

-- DropForeignKey
ALTER TABLE "suppliers" DROP CONSTRAINT "suppliers_counterparty_id_fkey";

-- DropForeignKey
ALTER TABLE "suppliers" DROP CONSTRAINT "suppliers_store_id_fkey";

-- DropForeignKey
ALTER TABLE "taxes" DROP CONSTRAINT "taxes_store_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_counterparty_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_store_id_fkey";

-- DropForeignKey
ALTER TABLE "units" DROP CONSTRAINT "units_store_id_fkey";

-- DropForeignKey
ALTER TABLE "user_organizations" DROP CONSTRAINT "user_organizations_user_id_fkey";

-- DropForeignKey
ALTER TABLE "write_offs" DROP CONSTRAINT "write_offs_store_id_fkey";

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "counterparty_id";

-- AlterTable
ALTER TABLE "product_variations" ADD COLUMN     "wholesale_price" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "suppliers" DROP COLUMN "counterparty_id";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "counterparty_id";

-- AlterTable
ALTER TABLE "units" DROP COLUMN "is_default";

-- AlterTable
ALTER TABLE "user_organizations" ALTER COLUMN "store_id" SET NOT NULL;

-- DropTable
DROP TABLE "_schema_registry";

-- DropTable
DROP TABLE "counterparties";

-- DropTable
DROP TABLE "store";

-- DropEnum
DROP TYPE "CounterpartyType";

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
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

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_hash_idx" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_organizations_user_id_key" ON "user_organizations"("user_id");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
