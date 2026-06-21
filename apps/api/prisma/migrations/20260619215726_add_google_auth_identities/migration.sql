ALTER TABLE "users"
ALTER COLUMN "password_hash" DROP NOT NULL;

CREATE TABLE "user_auth_identities" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "provider_user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_auth_identities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_auth_identities_provider_provider_user_id_key"
ON "user_auth_identities"("provider", "provider_user_id");

CREATE INDEX "user_auth_identities_user_id_idx"
ON "user_auth_identities"("user_id");

ALTER TABLE "user_auth_identities"
ADD CONSTRAINT "user_auth_identities_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
