-- AlterEnum
ALTER TYPE "TripStatus" ADD VALUE 'ON_TRIP';

-- AlterTable
ALTER TABLE "TripHistory" ADD COLUMN     "drivingDuration" DOUBLE PRECISION;
