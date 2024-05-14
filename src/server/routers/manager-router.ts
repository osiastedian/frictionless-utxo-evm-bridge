import { Router, json } from "express";
import { multisigPubKeys } from "../utils/utxo";
import { PrismaClient } from "@prisma/client";
import { TransactionStatus } from "../../enums/transaction-status";

const router = Router();

router.use(json());

router.get("/xpubs", (req, res) => {
  res.status(200).json({
    xpubs: multisigPubKeys,
  });
});

router.get("/unused-utxo", async (req, res) => {
  const prisma = new PrismaClient();

  const unusedTxs = await prisma.transaction.findMany({
    where: {
      status: TransactionStatus.COMPLETE,
      isUtxoUsed: false,
    },
    orderBy: {
      amount: "desc",
    },
  });

  res.status(200).json({
    txIds: unusedTxs.map((tx) => tx.id),
  });
});

export default router;
