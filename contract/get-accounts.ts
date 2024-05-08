import { ethers } from "ethers";

import dotenv from "dotenv";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.ROLLUX_RPC_URL);
const seed = process.env.MNEMONIC;
const hdWallet = ethers.Wallet.fromPhrase(seed!, provider);

const deployer = hdWallet.deriveChild(1);
const accountRegistrar = hdWallet.deriveChild(2);
const transactionRegistrar = hdWallet.deriveChild(3);
const payoutRegistrar = hdWallet.deriveChild(4);

console.log({
  first: hdWallet.deriveChild(0).address,
  deployer: deployer.address,
  accountRegistrar: accountRegistrar.address,
  transactionRegistrar: transactionRegistrar.address,
  payoutRegistrar: payoutRegistrar.address,
});
