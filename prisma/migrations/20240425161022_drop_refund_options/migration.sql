/*
  Warnings:

  - You are about to drop the column `refundAddress` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the column `refundTransactionHash` on the `Transfer` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Transfer_refundTransactionHash_key";

-- AlterTable
ALTER TABLE "Transfer" DROP COLUMN "refundAddress",
DROP COLUMN "refundTransactionHash";
