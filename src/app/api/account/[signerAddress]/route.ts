import {
  addSignedMessage,
  getAccountByRecipientAddress,
} from "@/service/account";
import { verifySignedMessage } from "@/utils/validations";
import { NextRequest, NextResponse } from "next/server";
import { registerAccount } from "@/utils/eth";

type PutParams = {
  signerAddress: string;
};

type PutBody = {
  signedMessage: string;
};
export const dynamic = "force-dynamic"; // defaults to auto
export async function PUT(
  request: NextRequest,
  { params }: { params: PutParams }
) {
  const { signerAddress } = params;

  const data: PutBody = await request.json();

  if (!data.signedMessage) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  const account = await getAccountByRecipientAddress(signerAddress);

  if (!account) {
    return NextResponse.json({ message: "Account not found" }, { status: 404 });
  }

  const isValid = verifySignedMessage(
    account.depositAddress,
    account.recipientAddress,
    data.signedMessage
  );

  if (!isValid) {
    return NextResponse.json(
      { message: "Invalid signed message" },
      { status: 400 }
    );
  }

  const transactionReceipt = await registerAccount(
    account.depositAddress,
    account.recipientAddress,
    data.signedMessage
  );

  if (!transactionReceipt) {
    return NextResponse.json(
      { message: "Failed to register account." },
      { status: 500 }
    );
  }

  const updatedAccount = await addSignedMessage(
    account.id,
    data.signedMessage,
    transactionReceipt
  );

  return NextResponse.json(updatedAccount, { status: 200 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: PutParams }
) {
  const { signerAddress } = params;

  const account = await getAccountByRecipientAddress(signerAddress);

  if (!account) {
    return NextResponse.json({ message: "Account not found" }, { status: 404 });
  }

  return NextResponse.json(account, { status: 200 });
}
