/*
  Warnings:

  - The `cancellation_party` column on the `refund` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `cancellation_reason` column on the `refund` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "refund" DROP COLUMN "cancellation_party",
ADD COLUMN     "cancellation_party" TEXT,
DROP COLUMN "cancellation_reason",
ADD COLUMN     "cancellation_reason" TEXT;

-- DropEnum
DROP TYPE "CancellationParty";

-- DropEnum
DROP TYPE "CancellationReason";
