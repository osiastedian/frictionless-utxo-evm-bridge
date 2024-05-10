import { DescriptorsFactory } from "@bitcoinerlab/descriptors";
import ecc from "@bitcoinerlab/secp256k1";
import { networks } from "../syscoin";

const network = networks.mainnet;
const { Output } = DescriptorsFactory(ecc);

// TO DO: Read this from file ex. signors.js
const multisigPubKeys = [
  "xpub6F8zphMorwJQTYqVn9tLqMLmsJhSTvjzLp7o4r8xFQN2Cav8WtAXGedGFcoKYT3VErXeT1UGjPeXkqeti8goAkWSkdpfxx1jNrtmewkhdxy",
  "xpub6EbZ83gpswWzhAQWGusyVSmivfns6borAw931sdmYzZjb28ZbKNt1wpuVsrhXvN8HF5PZ8n3pVridbYBqx4CnmLGiQpNGa6xtme2s5aYzve",
];

export const getDepositMultisigWallet = (index = 0) => {
  const pubKeys = multisigPubKeys.map(
    (base58pubkey) => `${base58pubkey}/${index}`
  );
  const descriptor = `wsh(multi(1,${pubKeys.join(",")}))`;
  const output = new Output({
    descriptor,
    network,
  });

  const address = output.getAddress();
  const pubkey = output.getScriptPubKey().toString("hex");

  return { address, pubkey };
};
