-- CreateEnum
CREATE TYPE "BookableObjectType" AS ENUM ('cottage', 'gazebo', 'banquet_hall', 'outdoor_venue', 'karaoke_bar');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('pending', 'confirmed', 'paid', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'succeeded', 'failed', 'refunded', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('card', 'SBP', 'yookassa');

-- CreateEnum
CREATE TYPE "MenuCategory" AS ENUM ('food', 'drink', 'snack', 'dessert');

-- CreateEnum
CREATE TYPE "RentalCategory" AS ENUM ('ski', 'tube', 'snowmobile', 'skates');

-- CreateEnum
CREATE TYPE "RentalSeasonType" AS ENUM ('winter', 'summer', 'year');

-- CreateEnum
CREATE TYPE "PassengerType" AS ENUM ('adult', 'child');

-- CreateTable
CREATE TABLE "customer" (
    "customer_id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "registration_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "bookable_object" (
    "bookable_object_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "base_price" DECIMAL(65,30) NOT NULL,
    "is_seasonal" BOOLEAN NOT NULL DEFAULT false,
    "season_start" DATE,
    "season_end" DATE,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "type" "BookableObjectType" NOT NULL,

    CONSTRAINT "bookable_object_pkey" PRIMARY KEY ("bookable_object_id")
);

-- CreateTable
CREATE TABLE "cottage" (
    "bookable_object_id" INTEGER NOT NULL,
    "amenities" TEXT,
    "bedrooms" INTEGER,
    "square_meters" INTEGER,

    CONSTRAINT "cottage_pkey" PRIMARY KEY ("bookable_object_id")
);

-- CreateTable
CREATE TABLE "gazebo" (
    "bookable_object_id" INTEGER NOT NULL,
    "amenities" TEXT,

    CONSTRAINT "gazebo_pkey" PRIMARY KEY ("bookable_object_id")
);

-- CreateTable
CREATE TABLE "banquet_hall" (
    "bookable_object_id" INTEGER NOT NULL,
    "max_tables" INTEGER,

    CONSTRAINT "banquet_hall_pkey" PRIMARY KEY ("bookable_object_id")
);

-- CreateTable
CREATE TABLE "outdoor_venue" (
    "bookable_object_id" INTEGER NOT NULL,

    CONSTRAINT "outdoor_venue_pkey" PRIMARY KEY ("bookable_object_id")
);

-- CreateTable
CREATE TABLE "karaoke_bar" (
    "bookable_object_id" INTEGER NOT NULL,
    "tables_amount" INTEGER,

    CONSTRAINT "karaoke_bar_pkey" PRIMARY KEY ("bookable_object_id")
);

-- CreateTable
CREATE TABLE "reservation" (
    "reservation_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "bookable_object_id" INTEGER NOT NULL,
    "reservation_date" DATE NOT NULL,
    "creation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guests_count" INTEGER NOT NULL,
    "total_sum" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "reservation_pkey" PRIMARY KEY ("reservation_id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "invoice_id" SERIAL NOT NULL,
    "reservation_id" INTEGER NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATE NOT NULL,
    "electronic_cheque" TEXT,
    "total_amount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "payment" (
    "payment_id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(65,30) NOT NULL,
    "transaction_id" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "method" "PaymentMethod",

    CONSTRAINT "payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "menu_item" (
    "menu_item_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "category" "MenuCategory",

    CONSTRAINT "menu_item_pkey" PRIMARY KEY ("menu_item_id")
);

-- CreateTable
CREATE TABLE "reservation_menu_item" (
    "quantity" INTEGER NOT NULL,
    "item_cost" DECIMAL(65,30) NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "reservationId" INTEGER NOT NULL,

    CONSTRAINT "reservation_menu_item_pkey" PRIMARY KEY ("reservationId","menuItemId")
);

-- CreateTable
CREATE TABLE "object_menu_item" (
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "bookableObjectId" INTEGER NOT NULL,
    "menuItemId" INTEGER NOT NULL,

    CONSTRAINT "object_menu_item_pkey" PRIMARY KEY ("menuItemId","bookableObjectId")
);

-- CreateTable
CREATE TABLE "rental_item" (
    "rental_item_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_per_hour" DECIMAL(65,30),
    "is_seasonal" BOOLEAN NOT NULL DEFAULT false,
    "max_capacity" INTEGER,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "category" "RentalCategory" NOT NULL,
    "season_type" "RentalSeasonType",

    CONSTRAINT "rental_item_pkey" PRIMARY KEY ("rental_item_id")
);

-- CreateTable
CREATE TABLE "rental_price_rule" (
    "rule_id" SERIAL NOT NULL,
    "rental_item_id" INTEGER NOT NULL,
    "price_per_km" DECIMAL(65,30) NOT NULL,
    "min_km" INTEGER NOT NULL DEFAULT 1,
    "max_km" INTEGER,
    "passenger_type" "PassengerType" NOT NULL,

    CONSTRAINT "rental_price_rule_pkey" PRIMARY KEY ("rule_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_email_key" ON "customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_bookable_object_id_reservation_date_key" ON "reservation"("bookable_object_id", "reservation_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_reservation_id_key" ON "invoice"("reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_invoice_id_key" ON "payment"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transaction_id_key" ON "payment"("transaction_id");

-- CreateIndex
CREATE INDEX "payment_status_idx" ON "payment"("status");

-- CreateIndex
CREATE INDEX "idx_payment_transaction" ON "payment"("transaction_id") WHERE (transaction_id IS NOT NULL);

-- CreateIndex
CREATE INDEX "menu_item_is_available_idx" ON "menu_item"("is_available");

-- CreateIndex
CREATE INDEX "object_menu_item_bookableObjectId_is_available_idx" ON "object_menu_item"("bookableObjectId", "is_available");

-- CreateIndex
CREATE INDEX "rental_item_category_is_active_idx" ON "rental_item"("category", "is_active");

-- CreateIndex
CREATE INDEX "rental_item_is_seasonal_season_type_idx" ON "rental_item"("is_seasonal", "season_type");

-- CreateIndex
CREATE UNIQUE INDEX "rental_price_rule_rental_item_id_passenger_type_key" ON "rental_price_rule"("rental_item_id", "passenger_type");

-- AddForeignKey
ALTER TABLE "cottage" ADD CONSTRAINT "cottage_bookable_object_id_fkey" FOREIGN KEY ("bookable_object_id") REFERENCES "bookable_object"("bookable_object_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gazebo" ADD CONSTRAINT "gazebo_bookable_object_id_fkey" FOREIGN KEY ("bookable_object_id") REFERENCES "bookable_object"("bookable_object_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banquet_hall" ADD CONSTRAINT "banquet_hall_bookable_object_id_fkey" FOREIGN KEY ("bookable_object_id") REFERENCES "bookable_object"("bookable_object_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outdoor_venue" ADD CONSTRAINT "outdoor_venue_bookable_object_id_fkey" FOREIGN KEY ("bookable_object_id") REFERENCES "bookable_object"("bookable_object_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karaoke_bar" ADD CONSTRAINT "karaoke_bar_bookable_object_id_fkey" FOREIGN KEY ("bookable_object_id") REFERENCES "bookable_object"("bookable_object_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_bookable_object_id_fkey" FOREIGN KEY ("bookable_object_id") REFERENCES "bookable_object"("bookable_object_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservation"("reservation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_menu_item" ADD CONSTRAINT "reservation_menu_item_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_item"("menu_item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_menu_item" ADD CONSTRAINT "reservation_menu_item_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservation"("reservation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_menu_item" ADD CONSTRAINT "object_menu_item_bookableObjectId_fkey" FOREIGN KEY ("bookableObjectId") REFERENCES "bookable_object"("bookable_object_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_menu_item" ADD CONSTRAINT "object_menu_item_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_item"("menu_item_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_price_rule" ADD CONSTRAINT "rental_price_rule_rental_item_id_fkey" FOREIGN KEY ("rental_item_id") REFERENCES "rental_item"("rental_item_id") ON DELETE CASCADE ON UPDATE CASCADE;
