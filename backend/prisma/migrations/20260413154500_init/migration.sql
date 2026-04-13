-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('paragraph', 'heading_1', 'heading_2', 'todo', 'code', 'divider', 'image');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "share_token" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "type" "BlockType" NOT NULL,
    "content" JSONB NOT NULL,
    "order_index" DOUBLE PRECISION NOT NULL,
    "parent_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_session" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "document_share_token_key" ON "document"("share_token");

-- CreateIndex
CREATE INDEX "document_user_id_updated_at_idx" ON "document"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "block_document_id_order_index_idx" ON "block"("document_id", "order_index");

-- CreateIndex
CREATE INDEX "block_parent_id_idx" ON "block"("parent_id");

-- CreateIndex
CREATE INDEX "refresh_session_user_id_revoked_at_idx" ON "refresh_session"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "refresh_session_expires_at_idx" ON "refresh_session"("expires_at");

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "block" ADD CONSTRAINT "block_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "block" ADD CONSTRAINT "block_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "block"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_session" ADD CONSTRAINT "refresh_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
