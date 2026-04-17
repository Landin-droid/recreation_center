/*
  Warnings:

  - A unique constraint covering the columns `[reservation_id]` on the table `payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kassa_payment_id]` on the table `payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotency_key]` on the table `payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idempotency_key` to the `payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reservation_id` to the `payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReservationPaymentStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CancellationExpenseType" AS ENUM ('FOOD_PURCHASE', 'SERVICE_THIRD_PARTY', 'EMPLOYEE_HOURS', 'DELIVERY', 'OTHER');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CancellationReasonCode" AS ENUM ('EARLY_CANCELLATION', 'FORCE_MAJEURE', 'CUSTOMER_REQUEST', 'PAYMENT_FAILED', 'PAYMENT_TIMEOUT', 'ADMIN_CANCELLATION', 'SYSTEM_CANCELLATION');

-- CreateEnum
CREATE TYPE "WebhookEventType" AS ENUM ('payment_succeeded', 'payment_failed', 'payment_cancelled', 'refund_completed', 'refund_failed');

-- DropIndex
DROP INDEX "idx_payment_transaction";

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "idempotency_key" TEXT NOT NULL,
ADD COLUMN     "kassa_payment_id" TEXT,
ADD COLUMN     "reservation_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "reservation" ADD COLUMN     "payment_deadline" TIMESTAMP(3),
ADD COLUMN     "payment_status" "ReservationPaymentStatus" NOT NULL DEFAULT 'PENDING_PAYMENT';

-- CreateTable
CREATE TABLE "cancellation_expense" (
    "expense_id" SERIAL NOT NULL,
    "reservation_id" INTEGER NOT NULL,
    "expense_type" "CancellationExpenseType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "receipt_url" TEXT,
    "supplier_name" TEXT,
    "is_refundable" BOOLEAN NOT NULL DEFAULT false,
    "refund_status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cancellation_expense_pkey" PRIMARY KEY ("expense_id")
);

-- CreateTable
CREATE TABLE "refund" (
    "refund_id" SERIAL NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "reservation_id" INTEGER NOT NULL,
    "original_amount" DECIMAL(65,30) NOT NULL,
    "total_expenses" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "refund_amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT,
    "cancellation_initiated_by" "CancellationReasonCode" NOT NULL,
    "cancellation_reason_code" "CancellationReasonCode" NOT NULL,
    "expense_documentation" TEXT,
    "kassa_refund_id" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "refund_pkey" PRIMARY KEY ("refund_id")
);

-- CreateTable
CREATE TABLE "webhook_log" (
    "webhook_log_id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "event_type" "WebhookEventType" NOT NULL,
    "payload" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_log_pkey" PRIMARY KEY ("webhook_log_id")
);

-- CreateIndex
CREATE INDEX "cancellation_expense_reservation_id_refund_status_idx" ON "cancellation_expense"("reservation_id", "refund_status");

-- CreateIndex
CREATE UNIQUE INDEX "refund_kassa_refund_id_key" ON "refund"("kassa_refund_id");

-- CreateIndex
CREATE INDEX "refund_status_created_at_idx" ON "refund"("status", "created_at");

-- CreateIndex
CREATE INDEX "refund_payment_id_idx" ON "refund"("payment_id");

-- CreateIndex
CREATE INDEX "webhook_log_source_created_at_idx" ON "webhook_log"("source", "created_at");

-- CreateIndex
CREATE INDEX "webhook_log_processed_idx" ON "webhook_log"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "payment_reservation_id_key" ON "payment"("reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_kassa_payment_id_key" ON "payment"("kassa_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_idempotency_key_key" ON "payment"("idempotency_key");

-- CreateIndex
CREATE INDEX "payment_kassa_payment_id_idx" ON "payment"("kassa_payment_id");

-- CreateIndex
CREATE INDEX "payment_idempotency_key_idx" ON "payment"("idempotency_key");

-- CreateIndex
CREATE INDEX "reservation_status_payment_deadline_idx" ON "reservation"("status", "payment_deadline");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservation"("reservation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_expense" ADD CONSTRAINT "cancellation_expense_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservation"("reservation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("payment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservation"("reservation_id") ON DELETE CASCADE ON UPDATE CASCADE;
