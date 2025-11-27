import { http } from "wagmi";
import { defineChain } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "wagmi/chains";

export const intuitionTestnet = defineChain({
  id: 13579,
  name: "Intuition Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "tTRUST",
    symbol: "tTRUST",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.rpc.intuition.systems/"],
    },
  },
  blockExplorers: {
    default: {
      name: "Intuition Explorer",
      url: "https://testnet.explorer.intuition.systems",
    },
  },
  testnet: true,
});

const projectId = "YOUR_WALLETCONNECT_PROJECT_ID";

export const config = getDefaultConfig({
  appName: "Intuition SDK/GraphQL Demo",
  projectId,
  chains: [intuitionTestnet, baseSepolia],
  transports: {
    [intuitionTestnet.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});
