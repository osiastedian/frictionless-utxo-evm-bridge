import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

const FundDistributorModule = buildModule("FundDistributorModule", (m) => {
  const owner = m.getAccount(0);
  const accountRegistrar = m.getAccount(1);
  const transactionRegistrar = m.getAccount(2);
  const payoutRegistrar = m.getAccount(3);

  const fundDistributor = m.contract("FundDistributor", [], { from: owner });
  const initialFund = ethers.parseEther("0.001");

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

  m.send("fundContract", fundDistributor, initialFund, undefined, {
    from: owner,
  });

  m.call(fundDistributor, "increaseLimit", [payoutRegistrar, initialFund], {
    from: owner,
    id: "increaseLimitForPayout",
  });

  return { fundDistributor };
});

export default FundDistributorModule;
