'use client';

import { type ReactNode } from 'react';
import { http, createConfig, WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterFrame } from '@farcaster/frame-wagmi-connector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from './components/posthog-provider';
import { FarcasterProvider } from './components/farcaster-provider';

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [farcasterFrame()],
});

const queryClient = new QueryClient();

export function Providers(props: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <FarcasterProvider autoAddFrame>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            {props.children}
          </QueryClientProvider>
        </WagmiProvider>
      </FarcasterProvider>
    </PostHogProvider>
  );
}
