export interface GetAPIStatusResponse {
  blockbook: Blockbook;
  backend: Backend;
}

export interface Backend {
  chain: string;
  blocks: number;
  headers: number;
  bestBlockHash: string;
  difficulty: string;
  sizeOnDisk: number;
  version: string;
  subversion: string;
  protocolVersion: string;
}

export interface Blockbook {
  coin: string;
  host: string;
  version: string;
  gitCommit: string;
  buildTime: Date;
  syncMode: boolean;
  initialSync: boolean;
  inSync: boolean;
  bestHeight: number;
  lastBlockTime: Date;
  inSyncMempool: boolean;
  lastMempoolTime: Date;
  mempoolSize: number;
  decimals: number;
  dbSize: number;
  about: string;
}

export interface GetBlockAPIResponse {
  page: number;
  totalPages: number;
  itemsOnPage: number;
  hash: string;
  previousBlockHash: string;
  height: number;
  confirmations: number;
  size: number;
  time: number;
  version: number;
  merkleRoot: string;
  nonce: string;
  bits: string;
  difficulty: string;
  txCount: number;
  txs: Tx[];
}

export interface Tx {
  txid: string;
  vin: Vin[];
  vout: Vin[];
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
  n: number;
  isAddress: boolean;
  value: string;
  addresses?: string[];
}
