CREATE TABLE "mobile_push_tokens" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "device_name" TEXT,
  "app_version" TEXT,
  "build_number" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "mobile_push_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mobile_push_tokens_token_key" ON "mobile_push_tokens"("token");
CREATE INDEX "mobile_push_tokens_user_id_idx" ON "mobile_push_tokens"("user_id");
CREATE INDEX "mobile_push_tokens_platform_idx" ON "mobile_push_tokens"("platform");

ALTER TABLE "mobile_push_tokens"
ADD CONSTRAINT "mobile_push_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
