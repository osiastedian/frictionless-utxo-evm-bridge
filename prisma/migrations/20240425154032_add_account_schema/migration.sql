-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "accountId" TEXT;

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "depositAddress" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "signedMessage" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_depositAddress_key" ON "Account"("depositAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Account_recipientAddress_key" ON "Account"("recipientAddress");

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
