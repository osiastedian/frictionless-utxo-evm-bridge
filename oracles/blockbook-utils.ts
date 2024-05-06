import axios from "axios";
import { Tx } from "./types/blockbook";
import dotenv from "dotenv";

dotenv.config();

const BLOCKBOOK_URL = process.env.BLOCKBOOK_API_URL;

if (!BLOCKBOOK_URL) {
  console.error("BLOCKBOOK_URL is not set");
  process.exit(1);
}
const blockBookApi = new axios.Axios({
  baseURL: BLOCKBOOK_URL,
});

export const getTransaction = async (txHash: string): Promise<Tx> => {
  return blockBookApi
    .get(`/v2/tx/${txHash}`)
    .then((resp) => JSON.parse(resp.data));
};
