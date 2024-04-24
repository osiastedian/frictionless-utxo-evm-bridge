import { networks } from "@/syscoin";
import { address as bitcoinAddressLib } from "bitcoinjs-lib";
import { isAddress as ethersIsAddress } from "ethers";

export const isValidSyscoinAddress = (address: string) => {
  try {
    bitcoinAddressLib.toOutputScript(address, networks.mainnet);
    return true;
  } catch (e) {
    return false;
  }
};

const minimumAmount = 0.0001;
const maximumAmount = 1000;

export const isValidAmount = (amount: number) => {
  return amount >= minimumAmount && amount <= maximumAmount;
};

export const isValidEthAddress = (address: string) => {
  return ethersIsAddress(address);
};
