/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Payout` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "error" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payout_id_key" ON "Payout"("id");
