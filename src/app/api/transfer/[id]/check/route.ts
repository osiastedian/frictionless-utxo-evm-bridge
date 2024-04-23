import {
  TransferStatus,
  getTransfer,
  updateTransfer,
} from "@/service/transfer";
import { NextRequest, NextResponse } from "next/server";

import { getAddress, getTx } from "@/utils/blockbook";

const BLOCKBOOK_API_RULE = "https://blockbook.syscoin.org";

const bitcoinToSatoshi = (amount: number) => amount * 100000000;

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  let transfer = await getTransfer(id);

  if (!transfer) {
    return NextResponse.json(
      { message: "Transfer not found" },
      { status: 404 }
    );
  }

  const { txids } = await getAddress(transfer.depositAddress);
  const txid = txids[txids.length - 1];

  const { confirmations, vout } = await getTx(txid);

  const isReceivingAddressCorrect = vout.some((out) =>
    out.addresses.includes(transfer!.depositAddress)
  );

  const isAmountCorrect = vout.some(
    (out) => out.value === `${bitcoinToSatoshi(transfer!.amount)}`
  );

  const isEnoughConfirmations = confirmations >= 6;

  const isValidDeposit =
    isReceivingAddressCorrect && isAmountCorrect && isEnoughConfirmations;

  if (isValidDeposit) {
    transfer = await updateTransfer(id, TransferStatus.Deposited);
  }

  return NextResponse.json(transfer, {
    status: 200,
  });
}
