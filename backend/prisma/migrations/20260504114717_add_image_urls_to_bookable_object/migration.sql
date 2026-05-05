-- AlterTable
ALTER TABLE "bookable_object" ADD COLUMN     "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];
