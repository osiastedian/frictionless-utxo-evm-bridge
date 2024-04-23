export interface Transfer {
  depositAddress: string;
  depositTransactionHash: string | null;
  refundAddress: string;
  refundTransactionHash: string | null;
  recipientAddress: string;
  receiptTransactionHash: string | null;
  amount: number;
  status:
    | "pending"
    | "deposited"
    | "completed"
    | "refunded"
    | "expired"
    | "partial-refund";
  createdAt: Date;
  updatedAt: Date;
}
