import { PrismaClient } from "@prisma/client";
import { getFundDistributorContract } from "../utils/eth";
import { formatEther } from "ethers";
import { TransactionStatus } from "../../enums/transaction-status";

export const listenToTransactions = async () => {
  const prisma = new PrismaClient();
  const contract = await getFundDistributorContract();

  console.log("Listening to Transactions...");

  return Promise.all([
    contract.on("TransactionComplete", (args: string[]) => {
      const [receiver, txId, amountInWei] = args;
      prisma.transaction
        .update({
          where: {
            id: txId,
            recipientAddress: receiver,
            amount: formatEther(amountInWei),
          },
          data: {
            status: TransactionStatus.COMPLETE,
          },
        })
        .then((transaction) => {
          console.log("Registered Transaction as Complete: ", transaction.id);
        });
    }),

    contract.on("TransactionPending", (args: string[]) => {
      const [receiver, depositAddress, txId, amountInWei] = args;

      prisma.transaction
        .create({
          data: {
            id: txId,
            amount: formatEther(amountInWei),
            depositAddress,
            recipientAddress: receiver,
          },
        })
        .then((transaction) => {
          console.log("Registered Transaction as Pending: ", transaction.id);
        });
    }),
  ]);
};
