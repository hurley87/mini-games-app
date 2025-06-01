'use client';

import { useEffect, useState } from 'react';
import { BuyCoinButton } from './BuyCoinButton';
import { useAccount, useConnect } from 'wagmi';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';

interface GameProps {
  id: string;
  timeoutSeconds?: number;
  coinAddress: string;
}

export function Game({ id, timeoutSeconds = 10, coinAddress }: GameProps) {
  const [loading, setLoading] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const { context, isReady } = useFarcasterContext({
    disableNativeGestures: true,
  });
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();

  console.log('address', address);

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

  if (!isReady) {
    return <div>Loading...</div>;
  }

  if (isGameOver) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <div className="text-center p-8 rounded-2xl bg-gray-800/50 border border-gray-700/50 max-w-md w-full mx-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
            Game Over
          </h1>
          <p className="text-xl text-gray-300 mb-8">{`Time's up!`}</p>
          {!isConnected ? (
            <div>
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="group relative px-8 py-4 text-lg font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span className="relative z-10">Connect Wallet</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 blur-sm"></div>
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
