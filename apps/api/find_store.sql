DO $$
DECLARE
    schema_rec RECORD;
    found_id TEXT;
    target_store_id TEXT := 'cmjff4kt300010rk5rz6zt0rf';
BEGIN
    FOR schema_rec IN SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'org_%'
    LOOP
        BEGIN
            EXECUTE format('SELECT id FROM %I.stores WHERE id = %L limit 1', schema_rec.schema_name, target_store_id) INTO found_id;
            IF found_id IS NOT NULL THEN
                RAISE NOTICE 'FOUND_STORE_SCHEMA: %', schema_rec.schema_name;
                RETURN;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore
        END;
    END LOOP;
    RAISE NOTICE 'Store not found';
END $$;
