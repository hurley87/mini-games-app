'use client';

import { type ReactNode } from 'react';
import { http, createConfig, WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterFrame } from '@farcaster/frame-wagmi-connector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from './components/posthog-provider';

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [farcasterFrame()],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

export function Providers(props: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {props.children}
        </QueryClientProvider>
      </WagmiProvider>
    </PostHogProvider>
  );
}
