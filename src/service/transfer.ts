import { PrismaClient, Transfer } from "@prisma/client";

export enum TransferStatus {
  Pending = "pending",
  Completed = "completed",
  Refunded = "refunded",
  Deposited = "deposited",
}

type CreateTransferParams = {
  amount: number;
};

export const createTransfer = async (params: CreateTransferParams) => {
  const prisma = new PrismaClient();

  const transfer = await prisma.transfer.create({
    data: {
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

export const updateTransferToDeposited = async (
  id: string,
  status: TransferStatus,
  transactionHash: string
) => {
  const prisma = new PrismaClient();

  const transfer = await prisma.transfer.update({
    where: {
      id,
    },
    data: {
      status,
      depositTransactionHash: transactionHash,
    },
  });

  return transfer;
};

export const getTransfers = async (
  filters: Partial<Transfer> = {},
  page = 1,
  size = 10
) => {
  const prisma = new PrismaClient();

  const transfers = await prisma.transfer.findMany({
    where: filters,
    skip: (page - 1) * size,
    take: size,
  });

  return transfers;
};
