import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const mnemonic = process.env.MNEMONIC;

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    rolluxTestnet: {
      url: "https://rpc-tanenbaum.rollux.com",
      accounts: {
        mnemonic,
        path: "m/44'/60'/0'/0/0",
        initialIndex: 0,
        count: 20,
        passphrase: "",
      },
    },
  },
};

export default config;
