/*
  Warnings:

  - You are about to drop the column `customer_id` on the `refresh_token` table. All the data in the column will be lost.
  - You are about to drop the column `customer_id` on the `reservation` table. All the data in the column will be lost.
  - You are about to drop the `customer` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `user_id` to the `refresh_token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `reservation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'USER');

-- RenameTable
ALTER TABLE "customer" RENAME TO "user";

-- RenameColumn
ALTER TABLE "user" RENAME COLUMN "customer_id" TO "user_id";

-- AddColumn
ALTER TABLE "user" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';


-- REFRESH TOKEN
-- RemoveOldFK
ALTER TABLE "refresh_token" DROP CONSTRAINT IF EXISTS "refresh_token_customer_id_fkey";

-- RenameColumn
ALTER TABLE "refresh_token" RENAME COLUMN "customer_id" TO "user_id";

-- RenameIndex
ALTER INDEX "refresh_token_customer_id_idx" RENAME TO "refresh_token_user_id_idx";

-- RestoreFK
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;


-- RESERVATION
-- RemoveOldFK
ALTER TABLE "reservation" DROP CONSTRAINT IF EXISTS "reservation_customer_id_fkey";

-- RenameColumn
ALTER TABLE "reservation" RENAME COLUMN "customer_id" TO "user_id";

-- RestoreFK
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;