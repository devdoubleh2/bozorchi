-- =====================================================
-- MULTI-TENANT SAFE MIGRATION
-- Adds delivery cost fields to product_variations
-- =====================================================
--
-- WARNING: This migration must be run on ALL tenant schemas
-- Use the companion migration script to execute across all tenants
--
-- Fields Added:
-- 1. product_variations.delivery_cost (required, defaults to 0)
-- 2. product_variations.delivery_cost_base (required, defaults to 0)
-- 3. product_variations.delivery_cost_currency (required, defaults to 'UZS')
--
-- NOTE: This migration replaces/supplements supplier_cost fields.
-- The supplier_cost fields (supplier_price, supplier_price_base,
-- supplier_price_currency) were previously used but the application
-- now uses delivery_cost fields for tracking delivery/shipping costs.
-- =====================================================

BEGIN;

-- Step 1: Add delivery_cost column with default 0
ALTER TABLE product_variations
  ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(15,2) NOT NULL DEFAULT 0;

-- Step 2: Add delivery_cost_base column with default 0
ALTER TABLE product_variations
  ADD COLUMN IF NOT EXISTS delivery_cost_base DECIMAL(15,2) NOT NULL DEFAULT 0;

-- Step 3: Add delivery_cost_currency column with default 'UZS'
ALTER TABLE product_variations
  ADD COLUMN IF NOT EXISTS delivery_cost_currency VARCHAR(10) NOT NULL DEFAULT 'UZS';

-- Step 3.1: Add delivery_cost column to transactions table (was missing)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(15,2) NOT NULL DEFAULT 0;

-- Step 4: Add helpful comments for documentation
COMMENT ON COLUMN product_variations.delivery_cost IS 'Delivery cost in original currency';
COMMENT ON COLUMN product_variations.delivery_cost_base IS 'Delivery cost converted to store base currency';
COMMENT ON COLUMN product_variations.delivery_cost_currency IS 'Currency code of delivery_cost (e.g., USD, EUR, UZS)';

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these after migration to verify success:
-- =====================================================
--
-- 1. Check all product_variations have the new columns:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'product_variations'
-- AND column_name IN ('delivery_cost', 'delivery_cost_base', 'delivery_cost_currency');
--
-- Expected: 3 rows with:
--   - delivery_cost: numeric(15,2), NO, 0
--   - delivery_cost_base: numeric(15,2), NO, 0
--   - delivery_cost_currency: character varying(10), NO, 'UZS'::character varying
--
-- =====================================================
