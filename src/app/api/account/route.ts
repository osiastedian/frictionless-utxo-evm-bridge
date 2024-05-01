import {
  createAccount,
  getAccountByRecipientAddress,
  getAccounts,
} from "@/service/account";
import { isValidEthAddress } from "@/utils/validations";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const data = await request.json();

  const { recipientAddress } = data;

  if (!recipientAddress) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  if (!isValidEthAddress(recipientAddress)) {
    return NextResponse.json(
      { message: "Invalid recipient address" },
      { status: 400 }
    );
  }

  try {
    let account = await getAccountByRecipientAddress(recipientAddress);
    if (account) {
      return NextResponse.json(account, { status: 200 });
    }
    account = await createAccount(recipientAddress);
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server  error" },
      { status: 500 }
    );
  }
}

const getNumericQueryParam = (
  key: string,
  searchParams: URLSearchParams,
  defaultValue = 1
): number => {
  let pageParam: string | number | null = searchParams.get(key);
  let page = defaultValue;
  if (pageParam && typeof pageParam !== "number") {
    page = parseInt(pageParam);
  }
  return isNaN(page) ? defaultValue : page;
};

export async function GET(request: NextRequest) {
  const urlSearchParams = request.nextUrl.searchParams;
  const page = getNumericQueryParam("page", urlSearchParams, 1);
  const size = getNumericQueryParam("size", urlSearchParams, 100);

  const accounts = await getAccounts(isNaN(page) ? 1 : page, size);

  return NextResponse.json({
    items: accounts,
    page,
    size,
  });
}
