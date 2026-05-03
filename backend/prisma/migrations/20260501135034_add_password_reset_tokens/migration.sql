-- DropIndex
DROP INDEX "menu_item_is_available_idx";

-- DropIndex
DROP INDEX "reservation_status_payment_deadline_idx";

-- DropIndex
DROP INDEX "webhook_log_processed_idx";

-- CreateIndex
CREATE INDEX "reservation_payment_deadline_idx" ON "reservation"("payment_deadline");

-- CreateIndex
CREATE INDEX "webhook_log_created_at_idx" ON "webhook_log"("created_at");

-- AlterTable
ALTER TABLE "user" ADD COLUMN "reset_password_token" TEXT;
ALTER TABLE "user" ADD COLUMN "reset_password_expires" TIMESTAMP(3);
