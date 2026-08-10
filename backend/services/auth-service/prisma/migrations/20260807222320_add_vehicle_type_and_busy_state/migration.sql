/*
  Warnings:

  - The `vehicleType` column on the `driver_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BIKE', 'MINI', 'COMFORT');

-- AlterTable
ALTER TABLE "driver_profiles" ADD COLUMN     "isBusy" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "vehicleType",
ADD COLUMN     "vehicleType" "VehicleType" NOT NULL DEFAULT 'BIKE';
