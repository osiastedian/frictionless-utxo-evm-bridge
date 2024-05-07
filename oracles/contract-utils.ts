import fs from "fs";
import { Interface, ethers } from "ethers";

const FUND_DISTRIBUTOR_ADDRESS = process.env.FUND_DISTRIBUTOR_ADDRESS;
const FUND_DISTRIBUTOR_ABI_FILE_PATH =
  process.env.FUND_DISTRIBUTOR_ABI_FILE_PATH ?? "./abi.json";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
const CHAIN_ID = process.env.CHAIN_ID;
const CHAIN_NAME = process.env.CHAIN_NAME;

console.log({
  RPC_URL,
  CHAIN_ID,
  CHAIN_NAME,
});

if (!PRIVATE_KEY) {
  console.error("PRIVATE_KEY is not set");
  process.exit(1);
}

if (!RPC_URL) {
  console.error("RPC_URL is not set");
  process.exit(1);
}

if (!CHAIN_ID) {
  console.error("CHAIN_ID is not set");
  process.exit(1);
}

if (!CHAIN_NAME) {
  console.error("CHAIN_NAME is not set");
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
export const provider = new ethers.JsonRpcProvider(RPC_URL, {
  chainId: parseInt(CHAIN_ID),
  name: CHAIN_NAME,
});
export const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
export const fundDistributorContract = new ethers.Contract(
  FUND_DISTRIBUTOR_ADDRESS,
  abi,
  wallet
);
