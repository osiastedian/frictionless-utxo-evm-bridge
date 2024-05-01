import dotenv from "dotenv";
import amqplib from "amqplib";
import { RegistrationTransaction } from "./types/registration";

dotenv.config();

const AMQP_URL = process.env.AMQP_URL;
const QUEUE_FOR_REGISTRATION = "for-registration-queue";
const abi = [
  "function registerTransaction(bytes32 txid,bytes32 receiverId,uint amount)",
];

if (!AMQP_URL) {
  console.error("AMQP_URL is not set");
  process.exit(1);
}

const run = async () => {
  console.log("Listening for RegistrationTransactions...");
  const queue = await amqplib.connect(AMQP_URL);

  const channel = await queue.createChannel();

  await channel.assertQueue(QUEUE_FOR_REGISTRATION, { durable: true });

  return channel.consume(QUEUE_FOR_REGISTRATION, async (message) => {
    if (!message) {
      return;
    }

    console.group("=== For-Registration QUEUE ===");

    const content = message.content.toString("utf-8");
    const parsedContent: RegistrationTransaction = JSON.parse(content);

    console.log("Received Content:", parsedContent);

    console.groupEnd();
    channel.ack(message);
  });
};

run();
