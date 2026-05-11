/*
  Warnings:

  - The primary key for the `object_menu_item` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `bookableObjectId` on the `object_menu_item` table. All the data in the column will be lost.
  - You are about to drop the column `menuItemId` on the `object_menu_item` table. All the data in the column will be lost.
  - The primary key for the `reservation_menu_item` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `menuItemId` on the `reservation_menu_item` table. All the data in the column will be lost.
  - You are about to drop the column `reservationId` on the `reservation_menu_item` table. All the data in the column will be lost.
  - Added the required column `bookable_object_id` to the `object_menu_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `menu_item_id` to the `object_menu_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `menu_item_id` to the `reservation_menu_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reservation_id` to the `reservation_menu_item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "object_menu_item" DROP CONSTRAINT "object_menu_item_bookableObjectId_fkey";

-- DropForeignKey
ALTER TABLE "object_menu_item" DROP CONSTRAINT "object_menu_item_menuItemId_fkey";

-- DropForeignKey
ALTER TABLE "reservation_menu_item" DROP CONSTRAINT "reservation_menu_item_menuItemId_fkey";

-- DropForeignKey
ALTER TABLE "reservation_menu_item" DROP CONSTRAINT "reservation_menu_item_reservationId_fkey";

-- DropIndex
DROP INDEX "object_menu_item_bookableObjectId_is_available_idx";

-- AlterTable
ALTER TABLE "menu_item" ADD COLUMN     "image_url" TEXT;

-- AlterTable
ALTER TABLE "object_menu_item" DROP CONSTRAINT "object_menu_item_pkey",
DROP COLUMN "bookableObjectId",
DROP COLUMN "menuItemId",
ADD COLUMN     "bookable_object_id" INTEGER NOT NULL,
ADD COLUMN     "menu_item_id" INTEGER NOT NULL,
ADD CONSTRAINT "object_menu_item_pkey" PRIMARY KEY ("menu_item_id", "bookable_object_id");

-- AlterTable
ALTER TABLE "reservation_menu_item" DROP CONSTRAINT "reservation_menu_item_pkey",
DROP COLUMN "menuItemId",
DROP COLUMN "reservationId",
ADD COLUMN     "menu_item_id" INTEGER NOT NULL,
ADD COLUMN     "reservation_id" INTEGER NOT NULL,
ADD CONSTRAINT "reservation_menu_item_pkey" PRIMARY KEY ("reservation_id", "menu_item_id");

-- CreateIndex
CREATE INDEX "object_menu_item_bookable_object_id_is_available_idx" ON "object_menu_item"("bookable_object_id", "is_available");

-- AddForeignKey
ALTER TABLE "reservation_menu_item" ADD CONSTRAINT "reservation_menu_item_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_item"("menu_item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_menu_item" ADD CONSTRAINT "reservation_menu_item_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservation"("reservation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_menu_item" ADD CONSTRAINT "object_menu_item_bookable_object_id_fkey" FOREIGN KEY ("bookable_object_id") REFERENCES "bookable_object"("bookable_object_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_menu_item" ADD CONSTRAINT "object_menu_item_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_item"("menu_item_id") ON DELETE CASCADE ON UPDATE CASCADE;
