import { intuitionTestnet } from "@/lib/config";
import { type Address, createPublicClient, http } from "viem";
import { useChainId, useConnections, useWalletClient } from "wagmi";
import { configureClient, API_URL_PROD, API_URL_DEV } from "@0xintuition/graphql";
import { getMultiVaultAddressFromChainId } from "@0xintuition/protocol";

export const useIntuitionClients = () => {
  const connections = useConnections();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();

  const publicClient = createPublicClient({
    chain: intuitionTestnet,
    transport: http(),
  });
  const contractAddress = getMultiVaultAddressFromChainId(chainId) as Address;
  configureClient({ apiUrl: process.env.NODE_ENV === "production" ? API_URL_PROD : API_URL_DEV });

  const isOnCorrectChain = chainId === intuitionTestnet.id;

  if (!connections || !walletClient || !isOnCorrectChain) {
    return null;
  }

  return {
    walletClient,
    publicClient,
    address: contractAddress,
  };
};
