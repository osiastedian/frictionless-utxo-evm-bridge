import { getDepositMultisigWallet } from "../utils/utxo";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createAccount = async (recipientAddress: string) => {
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
  const account = await prisma.account.findUnique({
    where: {
      recipientAddress: address,
    },
  });
  return account;
};

export const getAccountTransactions = async (id: string) => {
  const account = await prisma.account.findUnique({
    where: {
      id,
    },
    include: {
      transactions: true,
    },
  });
  return account;
};

export const addSignedMessage = async (
  id: string,
  signedMessage: string,
  registrationHash: string
) => {
  const account = await prisma.account.update({
    where: {
      id,
    },
    data: {
      signedMessage,
      registrationHash,
      signedAt: new Date(),
    },
  });
  return account;
};

export const getAccounts = async (page = 1, size = 100) => {
  const account = await prisma.account.findMany({
    skip: (page - 1) * size,
    take: size,
  });

  return account;
};
