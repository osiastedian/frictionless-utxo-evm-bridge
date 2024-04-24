import {
  TransferStatus,
  getTransfer,
  updateTransferToDeposited,
} from "@/service/transfer";
import { NextRequest, NextResponse } from "next/server";
import { Transfer } from "@prisma/client";
import { getAddress, getTx } from "@/utils/blockbook";

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

const checkPendingTransfer = async (transfer: Transfer) => {
  const { id } = transfer;
  const { txids } = await getAddress(transfer.depositAddress);

  if (txids.length === 0) {
    return NextResponse.json(
      { message: "No transactions found" },
      { status: 404 }
    );
  }

  const txid = txids[txids.length - 1];

  const { confirmations, vout } = await getTx(txid);

  const isReceivingAddressCorrect = vout.some((out) =>
    out.addresses.includes(transfer.depositAddress)
  );

  const isAmountCorrect = vout.some(
    (out) => out.value === `${bitcoinToSatoshi(transfer.amount)}`
  );

  const isEnoughConfirmations = confirmations >= 6;

  const isValidDeposit =
    isReceivingAddressCorrect && isAmountCorrect && isEnoughConfirmations;

  if (isValidDeposit) {
    transfer = await updateTransferToDeposited(
      id,
      TransferStatus.Deposited,
      txid
    );
  }

  return NextResponse.json(transfer, {
    status: 200,
  });
};

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

  if (transfer.status === TransferStatus.Pending) {
    return checkPendingTransfer(transfer);
  }

  return NextResponse.json(
    { message: "Invalid transfer status" },
    { status: 400 }
  );
}
