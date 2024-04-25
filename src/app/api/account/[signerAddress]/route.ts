import {
  addSignedMessage,
  getAccountByRecipientAddress,
} from "@/service/account";
import { verifySignedMessage } from "@/utils/validations";
import { NextRequest, NextResponse } from "next/server";

type PutParams = {
  signerAddress: string;
};

type PutBody = {
  signedMessage: string;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: PutParams }
) {
  const { signerAddress } = params;

  const data: PutBody = await request.json();

  if (!data.signedMessage) {
    return { status: 400, body: { message: "Missing required fields" } };
  }

  const account = await getAccountByRecipientAddress(signerAddress);

  if (!account) {
    return { status: 404, body: { message: "Account not found" } };
  }

  const isValid = verifySignedMessage(
    account.depositAddress,
    account.recipientAddress,
    data.signedMessage
  );

  if (!isValid) {
    return { status: 400, body: { message: "Invalid signed message" } };
  }

  const updatedAccount = await addSignedMessage(
    signerAddress,
    data.signedMessage
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
    return { status: 404, body: { message: "Account not found" } };
  }

  return NextResponse.json(account, { status: 200 });
}
