import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FundDistributorModule = buildModule("FundDistributorModule", (m) => {
  const fundDistributor = m.contract("FundDistributor");

  return { fundDistributor };
});

export default FundDistributorModule;
