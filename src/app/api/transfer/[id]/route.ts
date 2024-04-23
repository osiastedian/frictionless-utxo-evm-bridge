import { getTransfer } from "@/service/transfer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const transfer = await getTransfer(id);

  return NextResponse.json(transfer, { status: 200 });
}
