/*
  Warnings:

  - Added the required column `speed` to the `FleetTracking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FleetTracking" ADD COLUMN     "speed" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "FleetTrackingHistory" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "bookerLatitude" DOUBLE PRECISION NOT NULL,
    "bookerLongitude" DOUBLE PRECISION NOT NULL,
    "speed" TEXT NOT NULL,
    "tripStatus" "TripStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FleetTrackingHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FleetTrackingHistory" ADD CONSTRAINT "FleetTrackingHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
