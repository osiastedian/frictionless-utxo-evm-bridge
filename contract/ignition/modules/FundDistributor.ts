import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";

const FundDistributorModule = buildModule("FundDistributorModule", (m) => {
  const owner = m.getAccount(1);
  const accountRegistrar = m.getAccount(2);
  const transactionRegistrar = m.getAccount(3);
  const payoutRegistrar = m.getAccount(4);

  const fundDistributor = m.contract("FundDistributor", [], { from: owner });

  const accountRegistrarRole = m.staticCall(
    fundDistributor,
    "ACCOUNT_REGISTRAR",
    [],
    undefined,
    { id: "accountRegistrar" }
  );
  const transactionRegistrarRole = m.staticCall(
    fundDistributor,
    "TRANSACTION_REGISTRAR",
    [],
    undefined,
    { id: "transactionRegistrar" }
  );
  const payoutRegistrarRole = m.staticCall(
    fundDistributor,
    "PAYOUT_REGISTRAR",
    [],
    undefined,
    { id: "payoutRegistrar" }
  );

  m.call(
    fundDistributor,
    "addRegistrar",
    [accountRegistrar, accountRegistrarRole],
    { from: owner, id: "addAccountRegistrar" }
  );

  m.call(
    fundDistributor,
    "addRegistrar",
    [transactionRegistrar, transactionRegistrarRole],
    { from: owner, id: "addTransactionRegistrar" }
  );

  m.call(
    fundDistributor,
    "addRegistrar",
    [payoutRegistrar, payoutRegistrarRole],
    { from: owner, id: "addPayoutRegistrar" }
  );

  return { fundDistributor };
});

export default FundDistributorModule;
