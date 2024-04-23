import { createTransfer } from "@/service/transfer";
import { getDepositMultisigWallet } from "@/utils/utxo";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const wallet = getDepositMultisigWallet(0);
  return NextResponse.json(wallet, { status: 200 });
}

type RegisterTransferPayload = {
  recipient: string;
  refund: string;
  amount: number;
};

export async function POST(request: NextRequest) {
  const data: RegisterTransferPayload = await request.json();

  const { recipient, refund, amount } = data;

  const transfer = await createTransfer({
    amount,
    recipientAddress: recipient,
    refundAddress: refund,
  });

  return NextResponse.json(transfer);
}
