-- Migration: Make barcode nullable for services in all tenant schemas
-- This allows industry-standard service handling where services don't require barcodes
-- Run with: psql "$DATABASE_URL" -f prisma/tenant-migrations/001_make_barcode_nullable.sql

-- Tenant: org_cmitz2xah00090qno0t64on5i
ALTER TABLE IF EXISTS "org_cmitz2xah00090qno0t64on5i"."product_variations" 
ALTER COLUMN "barcode" DROP NOT NULL;

-- Tenant: org_cmj16w3mw00010rqjl2vk2rkb
ALTER TABLE IF EXISTS "org_cmj16w3mw00010rqjl2vk2rkb"."product_variations" 
ALTER COLUMN "barcode" DROP NOT NULL;

-- Tenant: org_cmj1by2bc0001j9bob3ju9zlu
ALTER TABLE IF EXISTS "org_cmj1by2bc0001j9bob3ju9zlu"."product_variations" 
ALTER COLUMN "barcode" DROP NOT NULL;

-- Tenant: org_cmj64m62r00010qpdj5sw0nsu
ALTER TABLE IF EXISTS "org_cmj64m62r00010qpdj5sw0nsu"."product_variations" 
ALTER COLUMN "barcode" DROP NOT NULL;

-- Tenant: org_cmje3eueo00010rk5rnee12cr
ALTER TABLE IF EXISTS "org_cmje3eueo00010rk5rnee12cr"."product_variations" 
ALTER COLUMN "barcode" DROP NOT NULL;

-- Tenant: org_cmjff4ek200040rk5it6qy8zx
ALTER TABLE IF EXISTS "org_cmjff4ek200040rk5it6qy8zx"."product_variations" 
ALTER COLUMN "barcode" DROP NOT NULL;

-- Tenant: org_cmjlmlg0z0001g0boo9c5nmv4
ALTER TABLE IF EXISTS "org_cmjlmlg0z0001g0boo9c5nmv4"."product_variations" 
ALTER COLUMN "barcode" DROP NOT NULL;

-- Tenant: org_cmjln5y340001iyboqtyf0vxk
ALTER TABLE IF EXISTS "org_cmjln5y340001iyboqtyf0vxk"."product_variations" 
ALTER COLUMN "barcode" DROP NOT NULL;

-- Tenant: org_cmkcyw8kx00010apeiyhdg1f4
ALTER TABLE IF EXISTS "org_cmkcyw8kx00010apeiyhdg1f4"."product_variations" 
ALTER COLUMN "barcode" DROP NOT NULL;
