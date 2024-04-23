-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "depositAddress" TEXT NOT NULL,
    "depositTransactionHash" TEXT,
    "refundAddress" TEXT NOT NULL,
    "refundTransactionHash" TEXT,
    "recipientAddress" TEXT NOT NULL,
    "receiptTransactionHash" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);
