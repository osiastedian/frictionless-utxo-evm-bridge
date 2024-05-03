import dotenv from "dotenv";
import amqplib from "amqplib";
import axios from "axios";
import { RegistrationTransaction } from "./types/registration";
import {
  ContractTransactionResponse,
  ethers,
  formatUnits,
  parseEther,
} from "ethers";
import { PrismaClient, Transaction } from "@prisma/client";
import { Tx } from "./types/blockbook";

dotenv.config();

const BITCOIN_IN_SATOSHI = 100_000_000;

const AMQP_URL = process.env.AMQP_URL;
const QUEUE_FOR_REGISTRATION = "for-registration-queue";
const DATABASE_URL = process.env.DATABASE_URL;

const RPC_URL = process.env.RPC_URL;
const TRANSACTION_REGISTRAR_PRIVATE_KEY =
  process.env.TRANSACTION_REGISTRAR_PRIVATE_KEY;

const FUND_DISTRIBUTOR_ADDRESS = process.env.FUND_DISTRIBUTOR_ADDRESS;

const BLOCKBOOK_URL = process.env.BLOCKBOOK_API_URL;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL;

if (!BLOCKBOOK_URL) {
  console.error("BLOCKBOOK_URL is not set");
  process.exit(1);
}

if (RPC_URL === undefined) {
  console.error("RPC_URL is not set");
  process.exit(1);
}

if (!TRANSACTION_REGISTRAR_PRIVATE_KEY) {
  console.error("TRANSACTION_REGISTRAR_PRIVATE_KEY is not set");
  process.exit(1);
}

if (!AMQP_URL) {
  console.error("AMQP_URL is not set");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

if (!FUND_DISTRIBUTOR_ADDRESS) {
  console.error("FUND_DISTRIBUTOR_ADDRESS is not set");
  process.exit(1);
}

if (!BRIDGE_API_URL) {
  console.error("BRIDGE_API_URL is not set");
  process.exit(1);
}

const blockBookApi = new axios.Axios({
  baseURL: BLOCKBOOK_URL,
});
const abi = [
  "function registerTransaction(bytes32 txid,bytes32 receiverId,uint amount)",
];
const provider = new ethers.JsonRpcProvider(RPC_URL, {
  chainId: 31337,
  name: "hard-hat",
});
const wallet = new ethers.Wallet(TRANSACTION_REGISTRAR_PRIVATE_KEY, provider);
const contract = new ethers.Contract(FUND_DISTRIBUTOR_ADDRESS, abi, wallet);
const bridgeApi = new axios.Axios({
  baseURL: DATABASE_URL,
});

const getTransaction = async (txHash: string): Promise<Tx> => {
  return blockBookApi
    .get(`/v2/tx/${txHash}`)
    .then((resp) => JSON.parse(resp.data));
};

const runTransactionVerifications = async (page = 0, size = 10) => {
  console.log(
    `Running Transaction Verifications: (page: ${page}, size: ${size} )`
  );
  const prisma = new PrismaClient();

  const transactions = await prisma.transaction.findMany({
    where: {
      registered: false,
    },
    skip: page * size,
    take: size,
    orderBy: {
      createdAt: "asc",
    },
  });

  if (transactions.length === 0) {
    setTimeout(() => {
      runTransactionVerifications();
    }, 60_000);
  }

  const forRegistration: Transaction[] = [];

  for (let transaction of transactions) {
    const tx = await getTransaction(transaction.txId);
    const updatedTransaction = await prisma.transaction.update({
      data: {
        confirmations: tx.confirmations,
      },
      where: {
        id: transaction.id,
      },
    });

    if (updatedTransaction.confirmations >= 10) {
      forRegistration.push(updatedTransaction);
    }
  }

  for (let transaction of forRegistration) {
    const hashedTxId = ethers.hashMessage(transaction.txId);
    const hashedReceiverId = ethers.hashMessage(transaction.depositAddress);
    const amountInWei = transaction.amount;
    const call: ContractTransactionResponse = await contract.getFunction(
      "registerTransaction"
    )(hashedTxId, hashedReceiverId, amountInWei);

    const receipt = await call.wait(1);

    if (!receipt || receipt.status === 0) {
      console.error("Transaction failed", { transaction });
    }

    console.log("Transaction registered", { receipt });
  }

  if (transactions.length === size) {
    setTimeout(() => {
      runTransactionVerifications(page + 1);
    }, 10_000);
  }
};

const run = async () => {
  console.log("Listening for RegistrationTransactions...");
  const queue = await amqplib.connect(AMQP_URL);

  const channel = await queue.createChannel();

  await channel.assertQueue(QUEUE_FOR_REGISTRATION, { durable: true });

  runTransactionVerifications();

  return channel.consume(
    QUEUE_FOR_REGISTRATION,
    async (message) => {
      if (!message) {
        return;
      }

      console.group("=== For-Registration QUEUE ===");

      const content = message.content.toString("utf-8");
      const parsedContent: RegistrationTransaction = JSON.parse(content);
      const value = parseInt(parsedContent.value) / BITCOIN_IN_SATOSHI;

      const valueInWei = formatUnits(parseEther(`${value}`), "wei");

      console.log("Received Content:", parsedContent, { value, valueInWei });

      const tx = await getTransaction(parsedContent.txId);

      console.log("Transaction:", tx);

      const isValidTx = tx.vout.some(
        (vout) =>
          vout.isAddress &&
          vout.addresses?.includes(parsedContent.deposit) &&
          vout.value === parsedContent.value
      );

      if (!isValidTx) {
        console.groupEnd();
        return;
      }

      const prisma = new PrismaClient();
      const existingTransaction = await prisma.transaction.findFirst({
        where: { txId: parsedContent.txId },
      });

      if (existingTransaction) {
        console.log("Transaction already registered. Skipping...");
        console.groupEnd();
        return;
      }

      await prisma.transaction.create({
        data: {
          txId: parsedContent.txId,
          recipientAddress: parsedContent.recipient,
          depositAddress: parsedContent.deposit,
          amount: valueInWei,
          confirmations: tx.confirmations,
        },
      });

      console.groupEnd();
    },
    {
      noAck: true,
    }
  );
};

run();
