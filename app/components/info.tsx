'use client';
import { useState, useEffect } from 'react';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';
import { usePlayStatus } from '@/hooks/usePlayStatus';
import { BuyCoinButton } from './BuyCoinButton';
import { useAccount, useConnect } from 'wagmi';

interface InfoProps {
  name: string;
  description: string;
  id: string;
  coinAddress: string;
  onPlay: () => void;
}

export function Info({
  name,
  description,
  id,
  coinAddress,
  onPlay,
}: InfoProps) {
  const { isReady } = useFarcasterContext();
  const { playStatus, isLoading, error, checkPlayStatus, recordPlay } =
    usePlayStatus();
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const { isConnected } = useAccount();
  const { connectors, connect } = useConnect();

  useEffect(() => {
    if (isReady && !hasCheckedStatus && id && coinAddress) {
      checkPlayStatus(id, coinAddress);
      setHasCheckedStatus(true);
    }
  }, [isReady, hasCheckedStatus, id, coinAddress, checkPlayStatus]);

  const handlePlay = async () => {
    if (!playStatus) return;

    if (playStatus.canPlay) {
      // Record the play if they haven't played before
      if (!playStatus.hasPlayed) {
        await recordPlay(id, coinAddress);
      }
      onPlay();
    }
  };

  if (!name) {
    return <div>Please enter a game name</div>;
  }

  if (!description) {
    return <div>Please enter a game description</div>;
  }

  if (!isReady || isLoading || !hasCheckedStatus) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!playStatus) {
    return <div>Unable to check play status</div>;
  }

  // Show different UI based on play status
  if (!playStatus.canPlay) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen relative z-50">
        <div className="flex flex-col items-center justify-center h-screen w-screen relative z-50 max-w-lg mx-auto gap-4 p-4">
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="text-sm text-gray-500 text-center">{description}</p>

          {playStatus.reason === 'needs_tokens' && (
            <div className="text-center space-y-4">
              <p className="text-lg text-yellow-600">
                {`You've played this game before! 🎮`}
              </p>
              <p className="text-sm text-gray-600">
                To continue playing, you need to own tokens for this game.
              </p>
              {!isConnected ? (
                <button
                  onClick={() => connect({ connector: connectors[0] })}
                  className="group relative px-8 py-4 text-lg font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span className="relative z-10">Connect Wallet</span>
                </button>
              ) : (
                <BuyCoinButton
                  coinAddress={coinAddress}
                  onSuccess={() => {
                    // Reset status check to re-verify after purchase
                    setHasCheckedStatus(false);
                  }}
                />
              )}
            </div>
          )}

          {playStatus.reason === 'no_wallet' && (
            <div className="text-center space-y-4">
              <p className="text-lg text-yellow-600">
                {`You've played this game before! 🎮`}
              </p>
              <p className="text-sm text-gray-600">
                Please connect your wallet to check if you own tokens.
              </p>
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="group relative px-8 py-4 text-lg font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span className="relative z-10">Connect Wallet</span>
              </button>
            </div>
          )}

          {playStatus.reason === 'balance_check_failed' && (
            <div className="text-center space-y-4">
              <p className="text-lg text-red-600">
                Unable to verify token ownership
              </p>
              <p className="text-sm text-gray-600">
                Please try again or purchase tokens to continue playing.
              </p>
              <BuyCoinButton
                coinAddress={coinAddress}
                onSuccess={() => {
                  setHasCheckedStatus(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Player can play - show the normal play button
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen relative z-50">
      <div className="flex flex-col items-center justify-center h-screen w-screen relative z-50 max-w-lg mx-auto gap-4 p-4">
        <h1 className="text-2xl font-bold">{name}</h1>
        <p className="text-sm text-gray-500 text-center">{description}</p>

        {!playStatus.hasPlayed && (
          <p className="text-sm text-green-600 font-medium">
            {`🎉 First time playing? It's free!`}
          </p>
        )}

        {playStatus.hasPlayed && playStatus.reason === 'has_tokens' && (
          <p className="text-sm text-blue-600 font-medium">
            🎮 You own tokens - play unlimited!
          </p>
        )}

        <button
          onClick={handlePlay}
          className="bg-white text-black py-2 text-2xl rounded-full px-10 hover:bg-gray-100 transition-colors"
        >
          Play
        </button>
      </div>
    </div>
  );
}
