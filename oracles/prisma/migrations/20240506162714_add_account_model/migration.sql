-- CreateTable
CREATE TABLE "Account" (
    "recipientAddress" TEXT NOT NULL,
    "depositAddress" TEXT NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("recipientAddress")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_recipientAddress_key" ON "Account"("recipientAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Account_depositAddress_key" ON "Account"("depositAddress");
