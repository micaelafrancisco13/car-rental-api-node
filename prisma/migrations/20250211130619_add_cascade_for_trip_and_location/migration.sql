-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_tripHistoryId_fkey";

-- DropForeignKey
ALTER TABLE "TripHistory" DROP CONSTRAINT "TripHistory_bookingId_fkey";

-- AddForeignKey
ALTER TABLE "TripHistory" ADD CONSTRAINT "TripHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_tripHistoryId_fkey" FOREIGN KEY ("tripHistoryId") REFERENCES "TripHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
