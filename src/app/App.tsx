import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { WagmiProvider, createConfig, http } from "wagmi";
import { ManageContract } from "./Manage/Contract";

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

export default function Home() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <main>
          <ManageContract />
        </main>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
