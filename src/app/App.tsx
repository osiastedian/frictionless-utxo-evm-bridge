import { Account as BridgeAccount } from "@prisma/client";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ReactNode } from "react";

import {
  WagmiProvider,
  createConfig,
  http,
  useAccount,
  useChainId,
  useConnect,
  useSignMessage,
  useSwitchChain,
} from "wagmi";
import { injected } from "wagmi/connectors";

const targetChainId = 57000;

export const config = createConfig({
  chains: [
    {
      id: 31337,
      name: "localhost",
      nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
      },
      rpcUrls: {
        default: {
          http: ["http://localhost:8545"],
        },
      },
    },
    {
      id: 57000,
      name: "Rollux Testnet",
      nativeCurrency: {
        decimals: 18,
        name: "Syscoin",
        symbol: "SYS",
      },
      rpcUrls: {
        default: {
          http: ["https://rpc-tanenbaum.rollux.com"],
        },
      },
    },
  ],
  transports: {
    "31337": http(),
    "57000": http(),
  },
});

const queryClient = new QueryClient();

const Account: React.FC<{ children: ReactNode }> = ({ children }) => {
  const account = useAccount();
  const { connect } = useConnect();
  const chainId = useChainId();

  const { switchChain } = useSwitchChain({});

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
    <>
      <span>
        Account: {account.address} <br /> Chain ID: {chainId}{" "}
      </span>
      {children}
    </>
  );
};

const SignDepositAccount: React.FC<{ depositAddress: string }> = ({
  depositAddress,
}) => {
  const { address } = useAccount();
  const { signMessageAsync, data: signedMessage } = useSignMessage();

  const { mutateAsync: submitSignedMessage } = useMutation({
    mutationKey: ["bridge-account", address, "update-signed-message"],
    mutationFn: () => {
      return fetch(`/api/account/${address}`, {
        body: JSON.stringify({ signedMessage }),
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
    },
  });

  if (!signedMessage) {
    return (
      <button onClick={() => signMessageAsync({ message: depositAddress })}>
        Sign Message
      </button>
    );
  }

  return (
    <>
      <span>Signature: {signedMessage}</span>
      <button onClick={() => submitSignedMessage()}>
        Submit Signed Message
      </button>
    </>
  );
};

const QuerySysAccount = () => {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { data: account, isError: accountIsError } = useQuery<BridgeAccount>({
    queryKey: ["bridge-account", address as string],
    queryFn: () => {
      return fetch("/api/account/" + address).then((resp) => {
        if (resp.status >= 400) {
          return Promise.reject(resp.json());
        }
        return resp.json();
      });
    },
    retry: false,
  });
  const { mutateAsync: requestAccount } = useMutation<BridgeAccount>({
    mutationKey: ["bridge-account", address, "create"],
    mutationFn: () => {
      return fetch("/api/account/", {
        body: JSON.stringify({ recipientAddress: address }),
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }).then((resp) => resp.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bridge-account", address as string],
      });
    },
  });

  if (!account || accountIsError) {
    return <button onClick={() => requestAccount()}>Request Account</button>;
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", maxWidth: "10rem" }}
    >
      <span>SYS Address: {account.depositAddress}</span>
      <SignDepositAccount depositAddress={account.depositAddress} />
    </div>
  );
};

export default function Home() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <main>Main Page</main>
        <Account>
          <QuerySysAccount />
        </Account>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
