'use client';

import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useEffect, useState } from 'react';

interface GameProps {
  id: string;
  userId: string;
}

export function Game({ id, userId }: GameProps) {
  const [loading, setLoading] = useState(true);
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
      if (!isFrameReady) {
        setFrameReady({
          disableNativeGestures: true
        });
      }
  }, [setFrameReady, isFrameReady]);

  if (!userId) {
    return <div>Please connect your wallet to play the game</div>;
  }

  if(!id) {
    return <div>Please enter a game id</div>;
  }

  // Debug logs
  console.log('Game ID:', id);

  const iframeUrl = `/api/embed/${id}?userId=${userId}&gameId=${id}`;
  console.log('Iframe URL:', iframeUrl);

  return (
    <div className='flex flex-col items-center justify-center h-screen w-screen relative z-50'>
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