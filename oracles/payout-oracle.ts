import dotenv from "dotenv";
import { Interface, ethers } from "ethers";
import { getTransaction } from "./blockbook-utils";
import fs from "fs";

dotenv.config();

const RPC_URL = process.env.RPC_URL;
const PAYOUT_REGISTRAR_PRIVATE_KEY = process.env.PAYOUT_REGISTRAR_PRIVATE_KEY;
const FUND_DISTRIBUTOR_ADDRESS = process.env.FUND_DISTRIBUTOR_ADDRESS;
const FUND_DISTRIBUTOR_ABI_FILE_PATH = process.env.FUND_DISTRIBUTOR_ABI_FILE_PATH ?? "./abi.json";

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

const abiRaw = fs.readFileSync(FUND_DISTRIBUTOR_ABI_FILE_PATH).toString();
const { abi: abiJson } = JSON.parse(abiRaw);

const abi = new Interface(abiJson);

const provider = new ethers.JsonRpcProvider(RPC_URL, {
  chainId: 31337,
  name: "hard-hat",
});
const wallet = new ethers.Wallet(PAYOUT_REGISTRAR_PRIVATE_KEY, provider);
const contract = new ethers.Contract(FUND_DISTRIBUTOR_ADDRESS, abi, wallet);

console.log("Payout Oracle is running");

const run = async () => {
  const PAYOUT_REGISTRAR = await contract.PAYOUT_REGISTRAR();
  const registrarRole = await contract.roles(wallet.address);
  if (registrarRole !== PAYOUT_REGISTRAR) {
    console.error("Payout registrar is not authorized to register payouts");
    process.exit(1);
  }

  return new Promise((resolve) => {
    contract.on(
      "TransactionPending",
      async (registrar, txId, depositor, amount) => {
        console.log("Event received", [registrar, txId, depositor, amount]);

        const tx = await getTransaction(txId);
        console.log("Payout transaction pending", tx);
      }
    );
  });
};
run();
