-- AlterTable
ALTER TABLE "user" RENAME CONSTRAINT "customer_pkey" TO "user_pkey";

-- RenameIndex
ALTER INDEX "customer_email_key" RENAME TO "user_email_key";
