import dotenv from "dotenv";
import { Interface, ethers } from "ethers";
import { getTransaction } from "./blockbook-utils";

dotenv.config();

const RPC_URL = process.env.RPC_URL;
const PAYOUT_REGISTRAR_PRIVATE_KEY = process.env.PAYOUT_REGISTRAR_PRIVATE_KEY;
const FUND_DISTRIBUTOR_ADDRESS = process.env.FUND_DISTRIBUTOR_ADDRESS;

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

// const abi = [
//   "function PAYOUT_REGISTRAR() public view returns (uint)",
//   "function roles(address) public view returns (uint)",
//   "event TransactionPending(address,bytes32,bytes32,uint)",
// ];

const abi = new Interface([
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "ECDSAInvalidSignature",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "length",
        type: "uint256",
      },
    ],
    name: "ECDSAInvalidSignatureLength",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "ECDSAInvalidSignatureS",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "signer",
        type: "address",
      },
    ],
    name: "RegisterReceiver",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "registrar",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "txId",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "TransactionComplete",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "registrar",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "txId",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "depositor",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "TransactionPending",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdraw",
    type: "event",
  },
  {
    inputs: [],
    name: "ACCOUNT_REGISTRAR",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PAYOUT_REGISTRAR",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TRANSACTION_REGISTRAR",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TX_STATUS_COMPLETED",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TX_STATUS_PENDING",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "registrar",
        type: "address",
      },
      {
        internalType: "uint8",
        name: "role",
        type: "uint8",
      },
    ],
    name: "addRegistrar",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "admin",
    outputs: [
      {
        internalType: "address payable",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address payable",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "changeOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "payoutRegistrar",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "limit",
        type: "uint256",
      },
    ],
    name: "increaseLimit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "isActive",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "limits",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "txId",
        type: "bytes32",
      },
    ],
    name: "payout",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "receiverAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "message",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "signedMessage",
        type: "bytes",
      },
    ],
    name: "registerAccount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "txid",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "receiverId",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "registerTransaction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "registrar",
        type: "address",
      },
    ],
    name: "removeRegistrar",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "roles",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "txAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "txRegistration",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "txStatus",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
]);

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
