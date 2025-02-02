-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "tripHistoryId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_tripHistoryId_fkey" FOREIGN KEY ("tripHistoryId") REFERENCES "TripHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
