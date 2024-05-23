import {
  useAccount,
  useBalance,
  useChainId,
  useConnect,
  useReadContract,
  useSwitchAccount,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { abi } from "../abi";

import { formatUnits, parseEther } from "ethers";
import { FormEvent, useState } from "react";
import { injected } from "wagmi/connectors";

const targetChainId = 57000;

const contractAddress = "0x778eeF0a761C67D470115bB23bE090DAe63a5B60";

const registrarAddresses = [
  "0x9837cf095fb3A386DAa3F71e366F2693CaD45Ca6",
  "0xe6c3B41a9aB60074E3970a93676eB3Afc3272D66",
  "0xA5B955586D31c08724cACD79e8C3220509863b5B",
];

const roleMap: Record<number, string> = {
  1: "Account",
  2: "Payout",
  3: "Transaction",
};

const Account: React.FC = () => {
  const account = useAccount();
  const { connect } = useConnect();
  const chainId = useChainId();

  const { switchChain } = useSwitchChain({});
  const { connectors, switchAccount } = useSwitchAccount();

  if (chainId !== targetChainId) {
    return (
      <button onClick={() => switchChain({ chainId: targetChainId })}>
        Switch Network
      </button>
    );
  }

  if (account.isDisconnected || !account.isConnected) {
    return (
      <button
        onClick={() =>
          connect({
            connector: injected(),
          })
        }
      >
        Connect
      </button>
    );
  }
  return (
    <span>
      Account: {account.address} <br /> Chain ID: {chainId}{" "}
      {connectors.map((connector) => (
        <button key={connector.id} onClick={() => switchAccount({ connector })}>
          Switch Account: {connector.name}
        </button>
      ))}
    </span>
  );
};

const TotalLimit = () => {
  const totalLimit = useReadContract({
    abi,
    address: contractAddress,
    functionName: "totalLimit",
  });

  if (!totalLimit.data || totalLimit.isFetched === false)
    return <div>Loading...</div>;

  return (
    <div>
      Total Limit:{JSON.stringify(formatUnits(totalLimit.data as bigint))}
    </div>
  );
};

const Balance = () => {
  const balance = useBalance({
    address: contractAddress,
  });

  if (!balance.data || balance.isFetched === false)
    return <div>Loading...</div>;

  return (
    <div>
      Balance:
      {JSON.stringify(formatUnits(balance.data.value, balance.data.decimals))}
    </div>
  );
};

const Admin: React.FC = () => {
  const admin = useReadContract({
    abi,
    address: contractAddress,
    functionName: "admin",
  });
  if (!admin.data || admin.isFetched === false) return <div>Loading...</div>;

  return <div>Admin: {admin.data as string}</div>;
};

const IncreaseLimitForm: React.FC<{ address: string }> = ({ address }) => {
  const [amount, setAmount] = useState("0");

  const {
    data: hash,
    writeContractAsync,
    reset,
    isPending,
  } = useWriteContract();

  const onSubmit = (formEvent: FormEvent) => {
    formEvent.preventDefault();

    const amountInWei = parseEther(amount);
    writeContractAsync({
      abi,
      address: contractAddress,
      functionName: "increaseLimit",
      args: [address, amountInWei],
    });
  };
  const onReset = () => {
    reset();
    setAmount("0");
  };

  if (hash) {
    return (
      <div>
        Successfully increased limit: {hash} <br />{" "}
        <button onClick={onReset}>Reset</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button type="submit" disabled={isPending}>
        Increase Limit
      </button>

      {isPending && <div>Processing...</div>}
    </form>
  );
};

const Roles: React.FC<{ address: string }> = ({ address }) => {
  const roles = useReadContract({
    abi,
    address: contractAddress,
    functionName: "roles",
    args: [address],
  });

  if (!roles.data || roles.isFetched === false) return <div>Loading...</div>;

  const role = roleMap[roles.data as number];

  return (
    <div>
      Role : {role}
      {role === "Payout" && <IncreaseLimitForm address={address} />}
    </div>
  );
};

const RegistrarLimit: React.FC<{ address: string }> = ({ address }) => {
  const limit = useReadContract({
    abi,
    address: contractAddress,
    functionName: "limits",
    args: [address],
  });

  if (limit.isFetched === false) return <div>Loading...</div>;

  return (
    <div>
      Limit:
      {JSON.stringify(formatUnits((limit.data as bigint) ?? 0, 18))}
    </div>
  );
};

export const ManageContract: React.FC = () => {
  return (
    <div>
      <Account />
      <hr />
      Contract Address: {contractAddress}
      <Balance />
      <TotalLimit />
      <Admin />
      {registrarAddresses.map((address) => (
        <div key={address}>
          <strong>Registrar: {address}</strong>
          <Roles address={address} />
          <RegistrarLimit address={address} />
        </div>
      ))}
    </div>
  );
};
