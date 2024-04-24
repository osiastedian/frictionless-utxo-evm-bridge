import { createTransfer, getTransfers } from "@/service/transfer";
import {
  isValidAmount,
  isValidEthAddress,
  isValidSyscoinAddress,
} from "@/utils/validations";
import { Transfer } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const allowedFilterKeys: (keyof Transfer)[] = ["status"];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const filters = Object.fromEntries(
    Array.from(searchParams.entries()).filter(([key]) =>
      allowedFilterKeys.includes(key as keyof Transfer)
    )
  );
  const page = Number(searchParams.get("page")) || 1;
  const size = Number(searchParams.get("size")) || 10;

  const transfers = await getTransfers(filters, page, size);

  return NextResponse.json({ items: transfers, page, size }, { status: 200 });
}

type RegisterTransferPayload = {
  recipient: string;
  refund: string;
  amount: number;
};

export async function POST(request: NextRequest) {
  const data: RegisterTransferPayload = await request.json();

  const { recipient, refund, amount } = data;

  if (!recipient || !refund || !amount) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  if (!isValidSyscoinAddress(refund)) {
    return NextResponse.json(
      { message: "Invalid refund address" },
      { status: 400 }
    );
  }

  if (!isValidAmount(amount)) {
    return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
  }

  if (!isValidEthAddress(recipient)) {
    return NextResponse.json(
      { message: "Invalid recipient address" },
      { status: 400 }
    );
  }

  const transfer = await createTransfer({
    amount,
    recipientAddress: recipient,
    refundAddress: refund,
  });

  return NextResponse.json(transfer);
}
