CREATE TABLE "store_invites" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "store_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "store_invites_token_hash_key" ON "store_invites"("token_hash");
CREATE INDEX "store_invites_organization_id_idx" ON "store_invites"("organization_id");
CREATE INDEX "store_invites_store_id_idx" ON "store_invites"("store_id");

ALTER TABLE "store_invites"
ADD CONSTRAINT "store_invites_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
