import express from "express";
import dotenv from "dotenv";

dotenv.config();

import accountRouter from "./routers/account-router";
import manageRouter from "./routers/manager-router";
import { listenToTransactions } from "./listeners/transactions";

const app = express();

app.use(express.json());

app.use("/api/account", accountRouter);

app.use("/api/manage", manageRouter);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});

listenToTransactions();
