/*
  Warnings:

  - You are about to drop the column `invoice_id` on the `payment` table. All the data in the column will be lost.
  - You are about to drop the column `transaction_id` on the `payment` table. All the data in the column will be lost.
  - You are about to drop the column `payment_status` on the `reservation` table. All the data in the column will be lost.
  - You are about to drop the `invoice` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "invoice" DROP CONSTRAINT "invoice_reservation_id_fkey";

-- DropForeignKey
ALTER TABLE "payment" DROP CONSTRAINT "payment_invoice_id_fkey";

-- DropIndex
DROP INDEX "payment_invoice_id_key";

-- DropIndex
DROP INDEX "payment_transaction_id_key";

-- AlterTable
ALTER TABLE "payment" DROP COLUMN "invoice_id",
DROP COLUMN "transaction_id";

-- AlterTable
ALTER TABLE "reservation" DROP COLUMN "payment_status",
ADD COLUMN     "cancellation_reason" TEXT;

-- DropTable
DROP TABLE "invoice";

-- DropEnum
DROP TYPE "ReservationPaymentStatus";
