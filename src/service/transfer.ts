import { getDepositMultisigWallet } from "@/utils/utxo";

import { PrismaClient } from "@prisma/client";

export enum TransferStatus {
  Pending = "pending",
  Completed = "completed",
  Refunded = "refunded",
  Deposited = "deposited",
}

type CreateTransferParams = {
  recipientAddress: string;
  amount: number;
  refundAddress: string;
};

export const createTransfer = async (params: CreateTransferParams) => {
  const prisma = new PrismaClient();
  const count = await prisma.transfer.count();
  const utxoWallet = getDepositMultisigWallet(count);

  const transfer = await prisma.transfer.create({
    data: {
      depositAddress: utxoWallet.address,
      refundAddress: params.refundAddress,
      recipientAddress: params.recipientAddress,
      amount: params.amount,
      status: TransferStatus.Pending,
    },
  });

  return transfer;
};

export const getTransfer = async (id: string) => {
  const prisma = new PrismaClient();

  const transfer = await prisma.transfer.findUnique({
    where: {
      id,
    },
  });

  return transfer;
};

export const updateTransfer = async (id: string, status: TransferStatus) => {
  const prisma = new PrismaClient();

  const transfer = await prisma.transfer.update({
    where: {
      id,
    },
    data: {
      status,
    },
  });

  return transfer;
};
