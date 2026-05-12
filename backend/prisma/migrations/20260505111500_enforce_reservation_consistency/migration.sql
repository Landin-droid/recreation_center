-- Repair rows that were marked with a cancellation reason without moving
-- the reservation itself to the cancelled state.
UPDATE "reservation"
SET "status" = 'cancelled'::"ReservationStatus"
WHERE "cancellation_reason" IS NOT NULL
  AND "status" <> 'cancelled'::"ReservationStatus";

-- A cancellation reason only makes sense for cancelled reservations.
ALTER TABLE "reservation"
ADD CONSTRAINT "reservation_cancellation_reason_status_check"
CHECK (
  "status" = 'cancelled'::"ReservationStatus"
  OR "cancellation_reason" IS NULL
);

-- Only one active reservation can occupy a bookable object on a given date.
-- Cancelled and expired reservations no longer block the date.
CREATE UNIQUE INDEX "reservation_active_object_date_unique"
ON "reservation" ("bookable_object_id", "reservation_date")
WHERE "status" NOT IN (
  'cancelled'::"ReservationStatus",
  'expired'::"ReservationStatus"
);
