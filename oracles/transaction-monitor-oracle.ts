import dotenv from "dotenv";
import axios, { AxiosResponse } from "axios";
import amqplib from "amqplib";
import { GetAPIStatusResponse, GetBlockAPIResponse } from "./types/blockbook";
import { RegistrationTransaction } from "./types/registration";

dotenv.config();

const BLOCKBOOK_URL = process.env.BLOCKBOOK_API_URL;
const AMQP_URL = process.env.AMQP_URL;
const API_URL = process.env.API_URL;
const QUEUE_FOR_REGISTRATION = "for-registration-queue";

console.log({
  BLOCKBOOK_URL,
  AMQP_URL,
  API_URL,
});

if (!BLOCKBOOK_URL) {
  console.error("BLOCKBOOK_URL is not set");
  process.exit(1);
}

if (!AMQP_URL) {
  console.error("AMQP_URL is not set");
  process.exit(1);
}

if (!API_URL) {
  console.error("API_URL is not set");
  process.exit(1);
}

const blockBookApi = new axios.Axios({
  baseURL: BLOCKBOOK_URL,
});

const bridgeApi = new axios.Axios({
  baseURL: API_URL,
});

const getLatestBlock = (): Promise<number> => {
  return blockBookApi.get("/").then((resp: AxiosResponse) => {
    const parsedResponse: GetAPIStatusResponse = JSON.parse(resp.data);
    return parsedResponse.blockbook.bestHeight;
  });
};

const getBlockTxs = (blockNumber: number) => {
  return blockBookApi.get(`/v2/block/${blockNumber}`).then((resp) => {
    const parsedResponse: GetBlockAPIResponse = JSON.parse(resp.data);
    return parsedResponse.txs;
  });
};

const getAccounts = () => {
  return bridgeApi.get("/account").then((resp) => JSON.parse(resp.data).items);
};

const scanBlock = async (
  blockNumber: number,
  accountMap: Record<string, string>
): Promise<RegistrationTransaction[]> => {
  const latestBlockTxs = await getBlockTxs(blockNumber);
  const validTxs: RegistrationTransaction[] = [];
  latestBlockTxs.forEach((tx) => {
    const { vout } = tx;
    vout
      .filter((out) => out.isAddress)
      .forEach((out) => {
        out.addresses?.forEach((address) => {
          const registeredAccount = accountMap[address];
          if (registeredAccount) {
            validTxs.push({
              txId: tx.txid,
              deposit: address,
              recipient: registeredAccount,
              value: out.value,
            });
          }
        });
      });
  });
  return validTxs;
};

const runRegistration = async (
  channel: amqplib.Channel,
  exit: () => void,
  lastBlock = -1
) => {
  console.group("\n======= NEW RUN =======");
  const latestBlock = 1808858; // await getLatestBlock(); // Test block: 1808858
  console.log("Latest Block:", latestBlock);
  if (latestBlock === lastBlock) {
    console.groupEnd();
    setTimeout(() => runRegistration(channel, exit, lastBlock), 20_000);
    return;
  }

  console.log("Fetching latest accounts..");

  const accounts: { depositAddress: string; recipientAddress: string }[] =
    await getAccounts();
  const accountMap = accounts.reduce((acc, account) => {
    acc[account.depositAddress] = account.recipientAddress;
    return acc;
  }, {} as Record<string, string>);

  console.log("Account Map: ", accountMap);

  console.log("Scanning Block...");
  const forRegistration = await scanBlock(latestBlock, accountMap);

  console.log("Valid Transactions: ", forRegistration.length);
  forRegistration.forEach((registration) => {
    const content = JSON.stringify(registration);
    console.log("Sending to QUEUE: ", content);
    channel.sendToQueue(QUEUE_FOR_REGISTRATION, Buffer.from(content), {
      persistent: true,
    });
  });

  console.groupEnd();
  setTimeout(() => runRegistration(channel, exit, latestBlock), 20_000);
};

const run = async () => {
  console.log("Starting transaction monitor oracle...");

  const queue = await amqplib.connect(AMQP_URL);

  const channel = await queue.createChannel();

  await channel.assertQueue(QUEUE_FOR_REGISTRATION, { durable: true });

  return new Promise((resolve) => {
    runRegistration(channel, () => {
      console.log("END");
      resolve(null);
    });
  });
};

run();
