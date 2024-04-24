/*
  Warnings:

  - A unique constraint covering the columns `[depositAddress]` on the table `Transfer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[depositTransactionHash]` on the table `Transfer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[refundTransactionHash]` on the table `Transfer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[receiptTransactionHash]` on the table `Transfer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Transfer_depositAddress_key" ON "Transfer"("depositAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_depositTransactionHash_key" ON "Transfer"("depositTransactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_refundTransactionHash_key" ON "Transfer"("refundTransactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_receiptTransactionHash_key" ON "Transfer"("receiptTransactionHash");
