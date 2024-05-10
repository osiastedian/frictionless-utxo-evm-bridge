import dotenv from "dotenv";
import { ContractTransactionResponse, ethers } from "ethers";
import { getTransaction } from "./blockbook-utils";
import { wallet, fundDistributorContract } from "./contract-utils";
import fs from "fs";

dotenv.config();

const RPC_URL = process.env.RPC_URL;
const PAYOUT_REGISTRAR_PRIVATE_KEY = process.env.PAYOUT_REGISTRAR_PRIVATE_KEY;
const FUND_DISTRIBUTOR_ADDRESS = process.env.FUND_DISTRIBUTOR_ADDRESS;
const FUND_DISTRIBUTOR_ABI_FILE_PATH =
  process.env.FUND_DISTRIBUTOR_ABI_FILE_PATH ?? "./abi.json";

console.log("Payout Constants", {
  RPC_URL,
  PAYOUT_REGISTRAR_PRIVATE_KEY,
  FUND_DISTRIBUTOR_ADDRESS,
});

if (RPC_URL === undefined) {
  console.error("RPC_URL is not set");
  process.exit(1);
}

if (!PAYOUT_REGISTRAR_PRIVATE_KEY) {
  console.error("PAYOUT_REGISTRAR_PRIVATE_KEY is not set");
  process.exit(1);
}

if (!FUND_DISTRIBUTOR_ADDRESS) {
  console.error("FUND_DISTRIBUTOR_ADDRESS is not set");
  process.exit(1);
}

if (fs.existsSync(FUND_DISTRIBUTOR_ABI_FILE_PATH) === false) {
  console.error("FUND_DISTRIBUTOR_ABI_FILE_PATH is not set");
  process.exit(1);
}
const BITCOIN_IN_SATOSHI = 100_000_000;

console.log("Payout Oracle is running");

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

        const call: ContractTransactionResponse = await fundDistributorContract.payout(txId);
        call.wait(1).then(() => {
          console.log("Payout completed", [txId, amountInSats]);
        });
      }
    );
  });
};
run();
