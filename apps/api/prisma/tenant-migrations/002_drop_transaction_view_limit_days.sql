-- Removes transaction_view_limit_days from stores in all tenant schemas
-- Run with: psql "$DATABASE_URL" -f prisma/tenant-migrations/002_drop_transaction_view_limit_days.sql

DO $$
DECLARE
  schema_record RECORD;
BEGIN
  FOR schema_record IN
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name LIKE 'org_%'
    ORDER BY schema_name
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER TABLE IF EXISTS %I.stores DROP COLUMN IF EXISTS transaction_view_limit_days',
        schema_record.schema_name
      );
      RAISE NOTICE 'Dropped transaction_view_limit_days in %.stores', schema_record.schema_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed for schema %: %', schema_record.schema_name, SQLERRM;
    END;
  END LOOP;
END $$;
