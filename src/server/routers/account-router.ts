import { Router } from "express";
import {
  isValidEthAddress,
  verifySignedMessage,
} from "../../utils/validations";
import {
  createAccount,
  getAccountByRecipientAddress,
  addSignedMessage,
} from "../../service/account";
import { registerAccount } from "../../utils/eth";

const router = Router();

router.post("/", async (req, res) => {
  const { recipientAddress } = req.body;

  if (!recipientAddress) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!isValidEthAddress(recipientAddress)) {
    return res.status(400).json({ message: "Invalid recipient address" });
  }

  try {
    let account = await getAccountByRecipientAddress(recipientAddress);
    if (account) {
      return res.json(account);
    }
    account = await createAccount(recipientAddress);
    return res.json(account).status(201);
  } catch (error) {
    return res.status(500).json({ message: "Internal server  error" });
  }
});

router.put("/:signerAddress", async (req, res) => {
  const { signerAddress } = req.params;

  const data = req.body;

  if (!data.signedMessage) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const account = await getAccountByRecipientAddress(signerAddress);

  if (!account) {
    return res.status(404).json({ message: "Account not found" });
  }

  const isValid = verifySignedMessage(
    account.depositAddress,
    account.recipientAddress,
    data.signedMessage
  );

  if (!isValid) {
    return res.status(400).json({ message: "Invalid signed message" });
  }

  const transactionReceipt = await registerAccount(
    account.depositAddress,
    account.recipientAddress,
    data.signedMessage
  );

  if (!transactionReceipt) {
    return res.status(500).json({ message: "Failed to register account." });
  }

  const updatedAccount = await addSignedMessage(
    account.id,
    data.signedMessage,
    transactionReceipt
  );

  return res.json(updatedAccount);
});

router.get("/:signerAddress", async (req, res) => {
  const { signerAddress } = req.params;

  const account = await getAccountByRecipientAddress(signerAddress);

  if (!account) {
    return res.status(404).json({ message: "Account not found" });
  }

  return res.json(account);
});

export default router;
