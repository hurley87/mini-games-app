'use client';

import { type ReactNode } from 'react';
import { http, createConfig, WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterFrame } from '@farcaster/frame-wagmi-connector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from './components/posthog-provider';
import { FarcasterProvider } from '@/hooks/useFarcasterContext';

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
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <FarcasterProvider autoAddFrame disableNativeGestures>
            {props.children}
          </FarcasterProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </PostHogProvider>
  );
}
