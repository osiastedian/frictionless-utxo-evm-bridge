import { getDepositMultisigWallet } from "@/utils/utxo";
import { PrismaClient } from "@prisma/client";

export const createAccount = async (recipientAddress: string) => {
  const prisma = new PrismaClient();
  const count = await prisma.account.count();
  const wallet = getDepositMultisigWallet(count);
  const account = await prisma.account.create({
    data: {
      depositAddress: wallet.address,
      recipientAddress,
    },
  });
  return account;
};

export const getAccountByRecipientAddress = async (address: string) => {
  const prisma = new PrismaClient();
  const account = await prisma.account.findUnique({
    where: {
      recipientAddress: address,
    },
  });
  return account;
};

export const addSignedMessage = async (id: string, signedMessage: string) => {
  const prisma = new PrismaClient();
  const account = await prisma.account.update({
    where: {
      id,
    },
    data: {
      signedMessage,
      signedAt: new Date(),
    },
  });
  return account;
};
