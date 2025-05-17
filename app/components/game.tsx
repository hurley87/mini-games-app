'use client';

import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useEffect, useState } from 'react';
import { BuyCoinButton } from './BuyCoinButton';
import { useAccount, useConnect } from 'wagmi';

interface GameProps {
  id: string;
  timeoutSeconds?: number;
  coinAddress: string;
}

export function Game({ id, timeoutSeconds = 10, coinAddress }: GameProps) {
  const [loading, setLoading] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();

  console.log('address', address);

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady({
        disableNativeGestures: true,
      });
    }
  }, [setFrameReady, isFrameReady]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsGameOver(true);
    }, timeoutSeconds * 1000);

    return () => clearTimeout(timer);
  }, [timeoutSeconds]);

  if (!id) {
    return <div>Please enter a game id</div>;
  }

  const userId = context?.user?.fid;

  // Debug logs
  console.log('Game ID:', id);

  const iframeUrl = `/api/embed/${id}?userId=${userId}&gameId=${id}`;
  console.log('Iframe URL:', iframeUrl);

  if (isGameOver) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">Game Over</h1>
          <p className="text-xl text-gray-300 mb-8">{`Time's up!`}</p>
          {!isConnected ? (
            <div>
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg hover:bg-opacity-90 transition-all"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <BuyCoinButton
                coinAddress={coinAddress}
                onSuccess={() => setIsGameOver(false)}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 top-0 left-0 w-full h-full">
      {loading && <p>Loading game...</p>}
      <iframe
        src={iframeUrl}
        sandbox="allow-scripts allow-same-origin"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
