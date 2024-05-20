-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_depositTransactionId_fkey";

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_depositTransactionId_fkey" FOREIGN KEY ("depositTransactionId") REFERENCES "Transaction"("txId") ON DELETE RESTRICT ON UPDATE CASCADE;
