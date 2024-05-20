-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "depositTransactionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payout_txHash_key" ON "Payout"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_depositTransactionId_key" ON "Payout"("depositTransactionId");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_depositTransactionId_fkey" FOREIGN KEY ("depositTransactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
