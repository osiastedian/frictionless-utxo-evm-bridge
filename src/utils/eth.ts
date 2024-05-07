import { Interface } from "ethers";
import { ethers, TransactionResponse } from "ethers";
import fs from "fs";

export const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
export const CHAIN_ID = process.env.CHAIN_ID || "31337";
export const CHAIN_NAME = process.env.CHAIN_NAME || "hard-hat";

export const signerPrivateKey = process.env.PRIVATE_KEY!;
export const FUND_DISTRIBUTOR_ADDRESS = process.env.FUND_DISTRIBUTOR_ADDRESS!;
export const FUND_DISTRIBUTOR_ABI_FILE_PATH =
  process.env.FUND_DISTRIBUTOR_ABI_FILE_PATH || "./abi.json";

if (fs.existsSync(FUND_DISTRIBUTOR_ABI_FILE_PATH) === false) {
  console.error("FUND_DISTRIBUTOR_ABI_FILE_PATH is not set");
  process.exit(1);
}

const getFundDistributorContract = () => {
  const provider = new ethers.JsonRpcProvider(RPC_URL, {
    chainId: parseInt(CHAIN_ID),
    name: CHAIN_NAME,
  });

  const signer = new ethers.Wallet(signerPrivateKey, provider);

  const abiRaw = fs.readFileSync(FUND_DISTRIBUTOR_ABI_FILE_PATH).toString();
  const { abi: abiJson } = JSON.parse(abiRaw);

  const abi = new Interface(abiJson);
  return new ethers.Contract(FUND_DISTRIBUTOR_ADDRESS, abi, signer);
};

export const registerAccount = async (
  depositAddress: string,
  recipientAddress: string,
  signedMessage: string
): Promise<string | null> => {
  const fundDistributorContract = getFundDistributorContract();
  const call: TransactionResponse =
    await fundDistributorContract.registerAccount(
      recipientAddress,
      depositAddress,
      signedMessage
    );
  const transactionReceipt = await call.wait(1);
  if (!transactionReceipt) {
    return null;
  }
  return transactionReceipt.hash;
};
