/*
  Warnings:

  - You are about to drop the `customers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory_audit_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory_audits` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory_batch_allocations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory_batches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `loyalty_cards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `polar_orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `price_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pricelist_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pricelists` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_variations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stores` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supplier_payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `suppliers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `taxes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `units` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `write_offs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "inventory" DROP CONSTRAINT "inventory_product_variation_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_audit_items" DROP CONSTRAINT "inventory_audit_items_inventory_audit_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_audit_items" DROP CONSTRAINT "inventory_audit_items_product_variation_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_batch_allocations" DROP CONSTRAINT "inventory_batch_allocations_batch_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_batches" DROP CONSTRAINT "inventory_batches_product_variation_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_batches" DROP CONSTRAINT "inventory_batches_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "loyalty_cards" DROP CONSTRAINT "loyalty_cards_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_payer_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "price_history" DROP CONSTRAINT "price_history_product_variation_id_fkey";

-- DropForeignKey
ALTER TABLE "pricelist_items" DROP CONSTRAINT "pricelist_items_pricelist_id_fkey";

-- DropForeignKey
ALTER TABLE "pricelist_items" DROP CONSTRAINT "pricelist_items_product_variation_id_fkey";

-- DropForeignKey
ALTER TABLE "product_variations" DROP CONSTRAINT "product_variations_product_id_fkey";

-- DropForeignKey
ALTER TABLE "product_variations" DROP CONSTRAINT "product_variations_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "product_variations" DROP CONSTRAINT "product_variations_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_product_category_id_fkey";

-- DropForeignKey
ALTER TABLE "supplier_payments" DROP CONSTRAINT "supplier_payments_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_original_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_product_variation_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "write_offs" DROP CONSTRAINT "write_offs_product_variation_id_fkey";

-- DropTable
DROP TABLE "customers";

-- DropTable
DROP TABLE "inventory";

-- DropTable
DROP TABLE "inventory_audit_items";

-- DropTable
DROP TABLE "inventory_audits";

-- DropTable
DROP TABLE "inventory_batch_allocations";

-- DropTable
DROP TABLE "inventory_batches";

-- DropTable
DROP TABLE "loyalty_cards";

-- DropTable
DROP TABLE "payments";

-- DropTable
DROP TABLE "polar_orders";

-- DropTable
DROP TABLE "price_history";

-- DropTable
DROP TABLE "pricelist_items";

-- DropTable
DROP TABLE "pricelists";

-- DropTable
DROP TABLE "product_categories";

-- DropTable
DROP TABLE "product_variations";

-- DropTable
DROP TABLE "products";

-- DropTable
DROP TABLE "stores";

-- DropTable
DROP TABLE "supplier_payments";

-- DropTable
DROP TABLE "suppliers";

-- DropTable
DROP TABLE "taxes";

-- DropTable
DROP TABLE "transactions";

-- DropTable
DROP TABLE "units";

-- DropTable
DROP TABLE "write_offs";

-- DropEnum
DROP TYPE "AuditStatus";

-- DropEnum
DROP TYPE "InventoryAllocationReference";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "ProductType";

-- DropEnum
DROP TYPE "TransactionType";

-- DropEnum
DROP TYPE "WriteOffReason";
