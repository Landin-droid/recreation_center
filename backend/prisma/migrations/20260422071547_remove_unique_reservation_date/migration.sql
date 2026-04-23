-- DropIndex
DROP INDEX "reservation_bookable_object_id_reservation_date_key";

-- CreateIndex
CREATE INDEX "reservation_bookable_object_id_reservation_date_idx" ON "reservation"("bookable_object_id", "reservation_date");
