'use client';

import { useMiniKit, useAddFrame } from '@coinbase/onchainkit/minikit';
import { useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { GamesView } from './components/GamesView';

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const { address } = useAccount();
  const { isConnected } = useAccount();
  const { connectors, connect } = useConnect();

  console.log('address', address);
  console.log('isConnected', isConnected);

  const addFrame = useAddFrame();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  useEffect(() => {
    if (!context?.client?.added) {
      (async () => {
        await addFrame();
      })();
    }
  }, [context]);

  useEffect(() => {
    const saveUser = async () => {
      if (context) {
        console.log('context', context);
        const user = context.user;
        console.log('user', user);

        // Only proceed if all required fields are present
        if (user.fid && user.displayName && user.pfpUrl && user.username) {
          const userData = {
            fid: user.fid,
            name: user.displayName,
            pfp: user.pfpUrl,
            username: user.username,
          };
          console.log('userData', userData);

          // Call the API endpoint to upsert user data
          await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });
        } else {
          console.warn('Missing required user data fields');
        }
      }
    };

    saveUser();
  }, [context]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse">
                Play Mini Games
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl">
                Connect your wallet to start your gaming adventure
              </p>
            </div>

            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="group relative px-8 py-4 text-lg font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="relative z-10">Connect Wallet</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 blur-sm"></div>
            </button>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              <div className="p-6 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
                <h3 className="text-xl font-semibold mb-2">Play Games</h3>
                <p className="text-gray-400">
                  Access exclusive mini-games in the Farcaster ecosystem
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
                <h3 className="text-xl font-semibold mb-2">Earn Rewards</h3>
                <p className="text-gray-400">
                  Win prizes and collect unique digital assets
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
                <h3 className="text-xl font-semibold mb-2">Join Community</h3>
                <p className="text-gray-400">
                  Connect with other players and share your achievements
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <GamesView />
          </div>
        )}
      </div>
    </div>
  );
}
