import express from "express";
import dotenv from "dotenv";

dotenv.config();

import accountRouter from "./routers/account-router";

const app = express();

app.use(express.json());

app.use("/api/account", accountRouter);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
