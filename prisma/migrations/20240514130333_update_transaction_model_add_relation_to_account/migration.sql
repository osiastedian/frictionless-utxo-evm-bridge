-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_depositAddress_fkey" FOREIGN KEY ("depositAddress") REFERENCES "Account"("depositAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
