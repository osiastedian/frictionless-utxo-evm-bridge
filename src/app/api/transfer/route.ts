import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Payload = {
  txId: string;
  recipientAddress: string;
  depositAddress: string;
  amount: string;
};

export async function POST(request: NextRequest) {
  console.log("NEW TRANSFER ", request.body);
  const body: Payload = await request.json();

  const account = await prisma.account.findFirst({
    where: {
      depositAddress: body.depositAddress,
    },
  });

  if (!account) {
    return NextResponse.json(
      {
        message: "Account not found",
      },
      { status: 404 }
    );
  }

  const transfer = await prisma.transfer.create({
    data: {
      accountId: account.id,
      depositTransactionHash: body.txId,
      status: "pending",
      amount: body.amount,
    },
  });

  return NextResponse.json(transfer, { status: 200 });
}
