import dotenv from "dotenv";
import { ContractTransactionResponse, ethers } from "ethers";
import { getTransaction } from "./blockbook-utils";
import { wallet, fundDistributorContract } from "./contract-utils";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const BITCOIN_IN_SATOSHI = 100_000_000;

console.log("Payout Oracle is running:", wallet.address);

const prisma = new PrismaClient();

const run = async () => {
  const PAYOUT_REGISTRAR = await fundDistributorContract.PAYOUT_REGISTRAR();
  const registrarRole = await fundDistributorContract.roles(wallet.address);
  if (registrarRole !== PAYOUT_REGISTRAR) {
    console.error("Payout registrar is not authorized to register payouts");
    process.exit(1);
  }

  return new Promise((resolve) => {
    fundDistributorContract.on(
      "TransactionPending",
      async (receiver, depositor, txId, amount: bigint) => {
        console.log("Event received", [receiver, depositor, txId, amount]);

        const amountInSats = ethers.formatUnits(amount, "wei");

        const tx = await getTransaction(txId);
        const fromSats = (val: string) => parseInt(val) / BITCOIN_IN_SATOSHI;
        const isValid = tx.vout.some(
          (vout) =>
            vout.isAddress &&
            vout.addresses &&
            vout.addresses.includes(depositor) &&
            ethers.parseEther(`${fromSats(vout.value)}`).toString() ===
              amountInSats.toString()
        );

        if (!isValid) {
          console.error("Invalid transaction from", [txId, amountInSats]);
          return;
        }

        let transaction = await prisma.payout.create({
          data: {
            depositTransactionId: txId,
            status: "pending",
          },
        });

        const call: ContractTransactionResponse =
          await fundDistributorContract.payout(txId);
        call
          .wait(1)
          .then(async (receipt) => {
            if (!receipt) {
              console.error("Failed to Payout Receipt");
              transaction = await prisma.payout.update({
                where: {
                  id: transaction.id,
                  depositTransactionId: txId,
                },
                data: {
                  status: "failed",
                },
              });
              return;
            }
            console.log("Payout completed", [txId, amountInSats]);
            transaction = await prisma.payout.update({
              where: {
                id: transaction.id,
                depositTransactionId: txId,
              },
              data: {
                txHash: receipt?.hash,
                status: "complete",
              },
            });
          })
          .catch(async (reason: string) => {
            console.error("Failed Payout Reason: ", reason);
            const failedTransaction = await prisma.payout.update({
              data: {
                error: reason,
                status: "failed",
              },
              where: {
                id: transaction.id,
                depositTransactionId: txId,
              },
            });
            console.log("Failed Payout:", failedTransaction);
          });
      }
    );
  });
};
run();
