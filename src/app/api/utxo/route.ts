import { getDepositMultisigWallet } from "@/utils/utxo";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const wallet = getDepositMultisigWallet(0);
  return NextResponse.json(wallet, { status: 200 });
}

type RegisterTransferPayload = {
  recipient: string;
  refund: string;
  deposit: string;
};

export async function POST(request: NextRequest) {
  const data: RegisterTransferPayload = await request.json();

  const { deposit, recipient, refund } = data;

  return NextResponse.json({ deposit, recipient, refund });
}
