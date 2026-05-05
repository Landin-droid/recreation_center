/*
  Warnings:

  - The values [card,SBP,yookassa] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('bank_card', 'sbp', 'yoo_money', 'sberbank', 'tinkoff_bank', 'qiwi', 'cash');
ALTER TABLE "payment" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'waiting_for_capture';
