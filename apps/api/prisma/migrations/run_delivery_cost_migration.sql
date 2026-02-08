-- =====================================================
-- MULTI-TENANT MIGRATION RUNNER
-- Applies delivery cost fields to ALL tenant schemas
-- =====================================================
--
-- Usage: Run this SQL file against the database
-- psql $DATABASE_URL -f run_delivery_cost_migration.sql
--
-- NOTE: This migration adds delivery_cost fields which replace/supplement
-- supplier_cost fields. The application now uses delivery_cost for tracking
-- delivery/shipping costs separately from supplier pricing.
-- =====================================================

DO $$
DECLARE
    schema_record RECORD;
    schema_count INTEGER := 0;
    success_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🚀 Starting delivery cost migration for all tenants...';

    FOR schema_record IN
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name LIKE 'org_%'
        ORDER BY schema_name
    LOOP
        schema_count := schema_count + 1;
        RAISE NOTICE '⏳ Processing schema: %', schema_record.schema_name;

        BEGIN
            -- Add delivery_cost column with default 0
            EXECUTE format('
                ALTER TABLE %I.product_variations
                ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(15,2) NOT NULL DEFAULT 0',
                schema_record.schema_name
            );

            -- Add delivery_cost_base column with default 0
            EXECUTE format('
                ALTER TABLE %I.product_variations
                ADD COLUMN IF NOT EXISTS delivery_cost_base DECIMAL(15,2) NOT NULL DEFAULT 0',
                schema_record.schema_name
            );

            -- Add delivery_cost_currency column with default 'UZS'
            EXECUTE format('
                ALTER TABLE %I.product_variations
                ADD COLUMN IF NOT EXISTS delivery_cost_currency VARCHAR(10) NOT NULL DEFAULT ''UZS''',
                schema_record.schema_name
            );

            -- Add delivery_cost column to TRANSACTION table (was missing)
            EXECUTE format('
                ALTER TABLE %I.transactions
                ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(15,2) NOT NULL DEFAULT 0',
                schema_record.schema_name
            );

            -- Add delivery_cost column to INVENTORY_BATCHES table (was missing)
            EXECUTE format('
                ALTER TABLE %I.inventory_batches
                ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(15,2)',
                schema_record.schema_name
            );

            -- Step 4: Add missing Uzum Payment fields to PAYMENTS table
            EXECUTE format('
                ALTER TABLE %I.payments
                ADD COLUMN IF NOT EXISTS uzum_payment_id TEXT,
                ADD COLUMN IF NOT EXISTS uzum_order_id TEXT,
                ADD COLUMN IF NOT EXISTS uzum_status TEXT',
                schema_record.schema_name
            );

            success_count := success_count + 1;
            RAISE NOTICE '✅ Successfully migrated schema: %', schema_record.schema_name;

        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Failed to migrate schema %: %', schema_record.schema_name, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '🎉 Migration complete! Processed % schemas, % successful', schema_count, success_count;
END $$;
