'use client';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from '@/app/components/ui/drawer';
import { Button } from '@/app/components/ui/button';
import Image from 'next/image';
import { List, Trophy, Wallet, Copy, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { trackGameEvent } from '@/lib/posthog';
import { sentryTracker } from '@/lib/sentry';

export function HeaderProfile() {
  const { context, isLoading } = useFarcasterContext();
  const { address } = useAccount();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    trackGameEvent.navigationClick('connect_wallet', 'header_profile');

    try {
      // Call distributor API
      const response = await fetch('/api/distributor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('Distributor data:', data.data);
        toast.success('Connected successfully!');
        trackGameEvent.userLogin(
          context?.user?.fid || 0,
          context?.user?.username || 'anonymous',
          address
        );
      } else {
        throw new Error(data.error || 'Failed to connect');
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      toast.error('Failed to connect');

      trackGameEvent.error(
        'connection_error',
        'Failed to connect to distributor',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );

      sentryTracker.apiError(
        error instanceof Error
          ? error
          : new Error('Failed to connect to distributor'),
        {
          endpoint: '/api/distributor',
          method: 'POST',
          status_code:
            error instanceof Error && 'status' in error
              ? (error as unknown as { status: number }).status
              : undefined,
        }
      );
    } finally {
      setIsConnecting(false);
    }
  };


  // Helper function to format address
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Helper function to copy address
  const copyAddress = (address: string) => {
    try {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard!');
      trackGameEvent.coinAddressCopy(address, 'user_wallet');
    } catch (error) {
      toast.error('Failed to copy address');
      sentryTracker.userActionError(
        error instanceof Error ? error : new Error('Failed to copy address'),
        {
          action: 'copy_wallet_address',
          element: 'wallet_address',
          page: 'header_profile',
        }
      );
    }
  };

  const handleGamesNavigation = () => {
    try {
      trackGameEvent.navigationClick('games', 'header_profile');
    } catch (error) {
      sentryTracker.userActionError(
        error instanceof Error
          ? error
          : new Error('Failed to track navigation'),
        {
          action: 'navigate_games',
          element: 'navigation_link',
          page: 'header_profile',
        }
      );
    }
  };

  const handleLeaderboardNavigation = () => {
    try {
      trackGameEvent.navigationClick('leaderboard', 'header_profile');
    } catch (error) {
      sentryTracker.userActionError(
        error instanceof Error
          ? error
          : new Error('Failed to track navigation'),
        {
          action: 'navigate_leaderboard',
          element: 'navigation_link',
          page: 'header_profile',
        }
      );
    }
  };

  // Check if user is connected
  const isConnected =
    context?.user && (context.user.fid || context.user.username);

  // Extract user data with fallbacks
  const userDisplayName =
    context?.user?.displayName || context?.user?.username || 'Anonymous';
  const userPfp = context?.user?.pfpUrl;

  // Show connect button if not connected
  if (!isLoading && !isConnected) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
        variant="outline"
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? 'Connecting...' : 'Connect'}
      </Button>
    );
  }
  console.log('address1', address);

  // Show profile drawer if connected
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <List className="w-6 h-6 text-gray-400 hover:text-purple-400 transition-colors cursor-pointer" />
      </DrawerTrigger>
      <DrawerContent className="bg-gray-900 border-gray-700">
        <div className="flex flex-col h-full">
          {/* Profile Section */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 overflow-hidden">
                {userPfp ? (
                  <Image
                    src={userPfp}
                    alt={`${userDisplayName} avatar`}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    onError={() => {
                      sentryTracker.userActionError(
                        'Failed to load user profile image',
                        {
                          action: 'image_load_error',
                          element: 'user_pfp',
                          page: 'header_profile',
                        }
                      );
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                    {isLoading
                      ? '...'
                      : userDisplayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-white">
                  {isLoading ? 'Loading...' : userDisplayName}
                </span>
                {address && (
                  <button
                    onClick={() => copyAddress(address)}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-purple-400 transition-colors self-start"
                  >
                    <span>{formatAddress(address)}</span>
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 p-6">
            {/* Menu Items */}
            <div className="space-y-6">
              <Link href="/" onClick={handleGamesNavigation}>
                <div className="flex items-center gap-4 text-xl font-semibold text-white hover:text-purple-400 transition-colors">
                  <Sparkles className="w-6 h-6" />
                  <span>Games</span>
                </div>
              </Link>

              <Link
                className="flex items-center gap-4 text-xl font-semibold text-white hover:text-purple-400 transition-colors cursor-pointer"
                href="/leaderboard"
                onClick={handleLeaderboardNavigation}
              >
                <Trophy className="w-6 h-6" />
                <span>Leaderboard</span>
              </Link>

            </div>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button
              variant="outline"
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
