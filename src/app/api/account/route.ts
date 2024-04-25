import { createAccount, getAccountByRecipientAddress } from "@/service/account";
import { isValidEthAddress } from "@/utils/validations";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const data = await request.json();

  const { recipientAddress } = data;

  if (!recipientAddress) {
    return { status: 400, body: { message: "Missing required fields" } };
  }

  if (!isValidEthAddress(recipientAddress)) {
    return { status: 400, body: { message: "Invalid recipient address" } };
  }

  try {
    let account = await getAccountByRecipientAddress(recipientAddress);
    if (account) {
      return NextResponse.json(account, { status: 200 });
    }
    account = await createAccount(recipientAddress);
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    return { status: 500, body: { message: "Internal server error" } };
  }
}
