"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { Analytics } from "@vercel/analytics/react";
import { config } from "@/lib/config";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
          <Toaster />
          <Analytics />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
