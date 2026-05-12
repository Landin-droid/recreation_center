/*
  Warnings:

  - The values [qiwi] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - The values [failed,refunded,cancelled,waiting_for_capture] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING,APPROVED,IN_PROGRESS,COMPLETED,REJECTED,CANCELLED] on the enum `RefundStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [confirmed,cancelled] on the enum `ReservationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ADMIN,STAFF,USER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [payment_failed,payment_cancelled,refund_completed,refund_failed] on the enum `WebhookEventType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `cheque_url` on the `payment` table. All the data in the column will be lost.
  - You are about to drop the column `cancellation_initiated_by` on the `refund` table. All the data in the column will be lost.
  - You are about to drop the column `cancellation_reason_code` on the `refund` table. All the data in the column will be lost.
  - You are about to drop the column `expense_documentation` on the `refund` table. All the data in the column will be lost.
  - You are about to drop the column `reservation_id` on the `refund` table. All the data in the column will be lost.
  - You are about to drop the column `total_expenses` on the `refund` table. All the data in the column will be lost.
  - You are about to drop the column `cancellation_reason` on the `reservation` table. All the data in the column will be lost.
  - You are about to drop the `cancellation_expense` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[payment_id]` on the table `refund` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cancellation_party` to the `refund` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cancellation_reason` to the `refund` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CancellationReason" AS ENUM ('general_decline', 'insufficient_funds', 'rejected_by_payee', 'rejected_by_timeout');

-- CreateEnum
CREATE TYPE "CancellationParty" AS ENUM ('yoo_money', 'refund_network');

-- CreateEnum
CREATE TYPE "ReceiptType" AS ENUM ('payment', 'refund');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('bank_card', 'yoo_money', 'sberbank', 'alfa_pay', 'tinkoff_bank', 'sbp', 'cash');
ALTER TABLE "payment" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('pending', 'succeeded', 'canceled');
ALTER TABLE "public"."payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "payment" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- DropForeignKey
ALTER TABLE "cancellation_expense" DROP CONSTRAINT "cancellation_expense_reservation_id_fkey";

-- DropTable
DROP TABLE "cancellation_expense";

-- DropEnum
DROP TYPE "CancellationExpenseType";

-- AlterEnum
BEGIN;
CREATE TYPE "RefundStatus_new" AS ENUM ('pending', 'succeeded', 'canceled');
ALTER TABLE "public"."refund" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "refund" ALTER COLUMN "status" TYPE "RefundStatus_new" USING ("status"::text::"RefundStatus_new");
ALTER TYPE "RefundStatus" RENAME TO "RefundStatus_old";
ALTER TYPE "RefundStatus_new" RENAME TO "RefundStatus";
DROP TYPE "public"."RefundStatus_old";
ALTER TABLE "refund" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

ALTER TABLE "reservation"
DROP CONSTRAINT IF EXISTS "reservation_cancellation_reason_status_check";

DROP INDEX IF EXISTS "reservation_active_object_date_unique";

-- AlterEnum
BEGIN;
CREATE TYPE "ReservationStatus_new" AS ENUM ('pending', 'paid', 'canceled', 'expired', 'refunded');
ALTER TABLE "public"."reservation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "reservation" ALTER COLUMN "status" TYPE "ReservationStatus_new" USING ("status"::text::"ReservationStatus_new");
ALTER TYPE "ReservationStatus" RENAME TO "ReservationStatus_old";
ALTER TYPE "ReservationStatus_new" RENAME TO "ReservationStatus";
DROP TYPE "public"."ReservationStatus_old";
ALTER TABLE "reservation" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('admin', 'staff', 'user');
ALTER TABLE "public"."user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WebhookEventType_new" AS ENUM ('payment_waiting_for_capture', 'payment_succeeded', 'payment_canceled', 'refund_succeeded');
ALTER TABLE "webhook_log" ALTER COLUMN "event_type" TYPE "WebhookEventType_new" USING ("event_type"::text::"WebhookEventType_new");
ALTER TYPE "WebhookEventType" RENAME TO "WebhookEventType_old";
ALTER TYPE "WebhookEventType_new" RENAME TO "WebhookEventType";
DROP TYPE "public"."WebhookEventType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "refund" DROP CONSTRAINT "refund_reservation_id_fkey";

-- DropIndex
DROP INDEX "payment_idempotency_key_idx";

-- DropIndex
DROP INDEX "payment_kassa_payment_id_idx";

-- AlterTable
ALTER TABLE "payment" DROP COLUMN "cheque_url";

-- AlterTable
ALTER TABLE "refund" DROP COLUMN "cancellation_initiated_by",
DROP COLUMN "cancellation_reason_code",
DROP COLUMN "expense_documentation",
DROP COLUMN "reservation_id",
DROP COLUMN "total_expenses",
ADD COLUMN     "cancellation_party" "CancellationParty" NOT NULL,
ADD COLUMN     "cancellation_reason" "CancellationReason" NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "reservation" DROP COLUMN "cancellation_reason";

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user';

-- DropEnum
DROP TYPE "CancellationReasonCode";

-- CreateTable
CREATE TABLE "receipt" (
    "receipt_id" SERIAL NOT NULL,
    "kassa_receipt_id" TEXT NOT NULL,
    "type" "ReceiptType" NOT NULL,
    "status" TEXT,
    "payment_id" INTEGER,
    "refund_id" INTEGER,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_pkey" PRIMARY KEY ("receipt_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "receipt_kassa_receipt_id_key" ON "receipt"("kassa_receipt_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_payment_id_key" ON "receipt"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_refund_id_key" ON "receipt"("refund_id");

-- CreateIndex
CREATE UNIQUE INDEX "refund_payment_id_key" ON "refund"("payment_id");

-- AddForeignKey
ALTER TABLE "receipt" ADD CONSTRAINT "receipt_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt" ADD CONSTRAINT "receipt_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "refund"("refund_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "reservation_active_object_date_unique"
ON "reservation" ("bookable_object_id", "reservation_date")
WHERE "status" NOT IN (
  'canceled'::"ReservationStatus",
  'expired'::"ReservationStatus",
  'refunded'::"ReservationStatus"
);