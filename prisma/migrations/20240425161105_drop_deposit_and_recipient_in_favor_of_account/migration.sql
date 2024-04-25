/*
  Warnings:

  - You are about to drop the column `depositAddress` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the column `recipientAddress` on the `Transfer` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Transfer_depositAddress_key";

-- AlterTable
ALTER TABLE "Transfer" DROP COLUMN "depositAddress",
DROP COLUMN "recipientAddress";
