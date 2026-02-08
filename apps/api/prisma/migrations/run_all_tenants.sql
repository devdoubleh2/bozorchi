-- =====================================================
-- MULTI-TENANT MIGRATION RUNNER (FIXED)
-- Applies multi-currency fields to ALL tenant schemas
-- Handles schemas that don't have supplier_price_currency column
-- =====================================================

DO $$
DECLARE
    schema_record RECORD;
    schema_count INTEGER := 0;
    success_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🚀 Starting multi-tenant migration...';
    
    FOR schema_record IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'org_%'
        ORDER BY schema_name
    LOOP
        schema_count := schema_count + 1;
        RAISE NOTICE '⏳ Processing schema: %', schema_record.schema_name;
        
        BEGIN
            -- Add supplier_price_currency column FIRST if it doesn't exist
            EXECUTE format('
                ALTER TABLE %I.product_variations 
                ADD COLUMN IF NOT EXISTS supplier_price_currency VARCHAR(10) DEFAULT ''UZS''', 
                schema_record.schema_name
            );
            
            -- Add supplier_price_base column
            EXECUTE format('
                ALTER TABLE %I.product_variations 
                ADD COLUMN IF NOT EXISTS supplier_price_base DECIMAL(15,2)', 
                schema_record.schema_name
            );
            
            -- Add last_exchange_rate column
            EXECUTE format('
                ALTER TABLE %I.product_variations 
                ADD COLUMN IF NOT EXISTS last_exchange_rate DECIMAL(15,6) NOT NULL DEFAULT 1', 
                schema_record.schema_name
            );
            
            -- Backfill supplier_price_base from supplier_price
            EXECUTE format('
                UPDATE %I.product_variations 
                SET supplier_price_base = supplier_price 
                WHERE supplier_price_base IS NULL', 
                schema_record.schema_name
            );
            
            -- Make supplier_price_base NOT NULL (only if column has no nulls)
            EXECUTE format('
                ALTER TABLE %I.product_variations 
                ALTER COLUMN supplier_price_base SET NOT NULL', 
                schema_record.schema_name
            );
            
            -- Set supplier_price_currency to UZS where NULL
            EXECUTE format('
                UPDATE %I.product_variations 
                SET supplier_price_currency = ''UZS'' 
                WHERE supplier_price_currency IS NULL', 
                schema_record.schema_name
            );
            
            -- Make supplier_price_currency NOT NULL with default
            EXECUTE format('
                ALTER TABLE %I.product_variations 
                ALTER COLUMN supplier_price_currency SET NOT NULL', 
                schema_record.schema_name
            );
            EXECUTE format('
                ALTER TABLE %I.product_variations 
                ALTER COLUMN supplier_price_currency SET DEFAULT ''UZS''', 
                schema_record.schema_name
            );
            
            -- Add transaction columns
            EXECUTE format('
                ALTER TABLE %I.transactions 
                ADD COLUMN IF NOT EXISTS source_currency VARCHAR(10)', 
                schema_record.schema_name
            );
            EXECUTE format('
                ALTER TABLE %I.transactions 
                ADD COLUMN IF NOT EXISTS source_amount DECIMAL(15,2)', 
                schema_record.schema_name
            );
            
            success_count := success_count + 1;
            RAISE NOTICE '✅ Successfully migrated: %', schema_record.schema_name;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Failed to migrate %: %', schema_record.schema_name, SQLERRM;
        END;
    END LOOP;
    
    SET search_path TO public;
    
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '📊 Migration Summary:';
    RAISE NOTICE '   Total schemas: %', schema_count;
    RAISE NOTICE '   Successful: %', success_count;
    RAISE NOTICE '   Failed: %', schema_count - success_count;
    RAISE NOTICE '==========================================';
END $$;
