-- Contract: exactly two roles, owner and cashier. Remove admin everywhere.
-- Avoid ALTER TYPE ... ADD VALUE + use-in-same-transaction (Postgres E55P04)
-- by recreating the enum and remapping in one transaction.

-- Drop the legacy default (references the old enum).
ALTER TABLE "user_organizations" ALTER COLUMN "role" DROP DEFAULT;

-- New enum with exactly the two values.
CREATE TYPE "Role_new" AS ENUM ('owner', 'cashier');

-- Remap: everything becomes cashier first via the new type.
ALTER TABLE "user_organizations"
  ALTER COLUMN "role" TYPE "Role_new"
  USING ('cashier'::"Role_new");

-- Owners (by owner link) hold the owner job.
UPDATE "user_organizations" AS m
SET "role" = 'owner'::"Role_new"
FROM "organizations" AS o
WHERE o."owner_id" = m."user_id";

-- New default + swap types.
ALTER TABLE "user_organizations" ALTER COLUMN "role" SET DEFAULT 'cashier'::"Role_new";
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
