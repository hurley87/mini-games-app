'use client';

import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useEffect, useState } from 'react';

interface GameProps {
  id: string;
  timeoutSeconds?: number; // Optional timeout in seconds
}

export function Game({ id, timeoutSeconds = 10 }: GameProps) {
  const [loading, setLoading] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const { setFrameReady, isFrameReady, context } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady({
        disableNativeGestures: true
      });
    }
  }, [setFrameReady, isFrameReady]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'iframe-ready') {
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsGameOver(true);
    }, timeoutSeconds * 1000);

    return () => clearTimeout(timer);
  }, [timeoutSeconds]);


  if(!id) {
    return <div>Please enter a game id</div>;
  }

  const userId = context?.user?.fid;

  if(!userId) {
    return <div>Please connect your wallet to play the game</div>;
  }

  // Debug logs
  console.log('Game ID:', id);

  const iframeUrl = `/api/embed/${id}?userId=${userId}&gameId=${id}`;
  console.log('Iframe URL:', iframeUrl);

  if (isGameOver) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">Game Over</h1>
          <p className="text-xl text-gray-300">{`Time's up!`}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 z-50 top-0 left-0 w-full h-full'>
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