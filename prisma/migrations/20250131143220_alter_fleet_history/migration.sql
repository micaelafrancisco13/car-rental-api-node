/*
  Warnings:

  - The `speed` column on the `FleetTracking` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `FleetTrackingHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FleetTrackingHistory" DROP CONSTRAINT "FleetTrackingHistory_bookingId_fkey";

-- AlterTable
ALTER TABLE "FleetTracking" DROP COLUMN "speed",
ADD COLUMN     "speed" DOUBLE PRECISION;

-- DropTable
DROP TABLE "FleetTrackingHistory";

-- CreateTable
CREATE TABLE "TripHistory" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "tripStatus" "TripStatus" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripHistory_bookingId_idx" ON "TripHistory"("bookingId");

-- CreateIndex
CREATE INDEX "TripHistory_recordedAt_idx" ON "TripHistory"("recordedAt");

-- AddForeignKey
ALTER TABLE "TripHistory" ADD CONSTRAINT "TripHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
