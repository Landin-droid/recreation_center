/*
  Warnings:

  - You are about to drop the column `bedrooms` on the `cottage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cottage" DROP COLUMN "bedrooms";

-- AlterTable
ALTER TABLE "rental_price_rule" ALTER COLUMN "max_km" SET DATA TYPE DECIMAL(65,30);
