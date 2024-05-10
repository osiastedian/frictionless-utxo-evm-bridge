import { DescriptorsFactory } from "@bitcoinerlab/descriptors";
import ecc from "@bitcoinerlab/secp256k1";
import { networks } from "../syscoin";
import fs from "fs";

const network =
  process.env.IS_TESTNET === "true" ? networks.testnet : networks.mainnet;

const { Output } = DescriptorsFactory(ecc);

// TO DO: Read this from file ex. signors.js
const utxoPubkeysRaw = fs.readFileSync(".utxo-pubkeys.json").toString("utf-8");
const multisigPubKeys: string[] = JSON.parse(utxoPubkeysRaw);
const minimumRequiredApprovals = process.env.MIN_APPROVALS ?? "1";

console.log({ network, multisigPubKeys, minimumRequiredApprovals });

export const getDepositMultisigWallet = (index = 0) => {
  const pubKeys = multisigPubKeys.map(
    (base58pubkey) => `${base58pubkey}/${index}`
  );
  const descriptor = `wsh(multi(${minimumRequiredApprovals},${pubKeys.join(
    ","
  )}))`;
  const output = new Output({
    descriptor,
    network,
  });

  const address = output.getAddress();
  const pubkey = output.getScriptPubKey().toString("hex");

  return { address, pubkey };
};
