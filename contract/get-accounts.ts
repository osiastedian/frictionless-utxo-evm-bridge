import { ethers } from "ethers";

import dotenv from "dotenv";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.ROLLUX_RPC_URL, {
  chainId: parseInt(process.env.ROLLUX_CHAIN_ID!, 10),
  name: process.env.ROLLUX_CHAIN_NAME,
});
const seed = process.env.MNEMONIC;

const hdWallet = ethers.Wallet.fromPhrase(seed!, provider);

const deployer = hdWallet.deriveChild(0);
const accountRegistrar = hdWallet.deriveChild(1);
const transactionRegistrar = hdWallet.deriveChild(2);
const payoutRegistrar = hdWallet.deriveChild(3);

const balances = [
  provider.getBalance(deployer.address),
  provider.getBalance(accountRegistrar.address),
  provider.getBalance(transactionRegistrar.address),
  provider.getBalance(payoutRegistrar.address),
];

provider
  .getBalance("0x778eeF0a761C67D470115bB23bE090DAe63a5B60")
  .then((contract) => {
    console.log("Contract balance:", ethers.formatEther(contract));
  });

Promise.allSettled(balances).then((results) => {
  const accounts = [
    deployer,
    accountRegistrar,
    transactionRegistrar,
    payoutRegistrar,
  ];
  console.table(
    results.map((result, index) => {
      const account = accounts[index];
      return {
        address: account.address,
        privateKey: account.privateKey,
        balance: ethers.formatEther(
          result.status === "fulfilled" ? result.value : "0"
        ),
      };
    })
  );
});
