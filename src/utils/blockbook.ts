export const BLOCKBOOK_API_RULE = "https://blockbook.syscoin.org";

export interface GetAddressResponse {
  page: number;
  totalPages: number;
  itemsOnPage: number;
  address: string;
  balance: string;
  totalReceived: string;
  totalSent: string;
  unconfirmedBalance: string;
  unconfirmedTxs: number;
  txs: number;
  txids: string[];
}

export interface GetTransactionResponse {
  txid: string;
  version: number;
  vin: Vin[];
  vout: Vout[];
  blockHash: string;
  blockHeight: number;
  confirmations: number;
  blockTime: number;
  value: string;
  valueIn: string;
  fees: string;
  hex: string;
}

export interface Vin {
  txid: string;
  sequence: number;
  n: number;
  addresses: string[];
  isAddress: boolean;
  value: string;
}

export interface Vout {
  value: string;
  n: number;
  hex: string;
  addresses: string[];
  isAddress: boolean;
}

export const getAddress = async (
  address: string
): Promise<GetAddressResponse> => {
  const response = await fetch(
    `${BLOCKBOOK_API_RULE}/api/v2/address/${address}`
  );
  const data = await response.json();

  return data;
};

export const getTx = async (txId: string): Promise<GetTransactionResponse> => {
  const response = await fetch(`${BLOCKBOOK_API_RULE}/api/v2/tx/${txId}`);
  const data = await response.json();

  return data;
};
