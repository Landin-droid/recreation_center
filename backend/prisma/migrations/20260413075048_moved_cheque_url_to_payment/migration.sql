/*
  Warnings:

  - You are about to drop the column `electronic_cheque` on the `invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invoice" DROP COLUMN "electronic_cheque";

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "cheque_url" TEXT;
