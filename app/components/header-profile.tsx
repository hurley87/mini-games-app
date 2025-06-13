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
import {
  List,
  Trophy,
  Wallet,
  Copy,
  Sparkles,
  Share2,
  Info as InfoIcon,
} from 'lucide-react';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';
import { toast } from 'sonner';
import { useAccount, useConnect } from 'wagmi';
import Link from 'next/link';
import { trackGameEvent } from '@/lib/posthog';
import { sentryTracker } from '@/lib/sentry';
import { sdk } from '@farcaster/frame-sdk';

export function HeaderProfile() {
  const { context, isLoading } = useFarcasterContext();
  const { address } = useAccount();
  const {
    connect,
    connectors,
    isPending: isConnecting,
  } = useConnect({
    mutation: {
      onSuccess(data) {
        toast.success('Connected successfully!');
        trackGameEvent.userLogin(
          context?.user?.fid || 0,
          context?.user?.username || 'anonymous',
          data.accounts[0] ?? address
        );
      },
      onError(error: unknown) {
        console.error('Failed to connect:', error);
        toast.error('Failed to connect');

        trackGameEvent.error('connection_error', 'Failed to connect wallet', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        sentryTracker.userActionError(
          error instanceof Error
            ? error
            : new Error('Failed to connect wallet'),
          {
            action: 'connect_wallet',
            element: 'connect_button',
            page: 'header_profile',
          }
        );
      },
    },
  });

  // Trigger wagmi connect flow when user presses the button
  const handleConnect = () => {
    trackGameEvent.navigationClick('connect_wallet', 'header_profile');

    if (connectors && connectors.length > 0) {
      connect({ connector: connectors[0] });
    } else {
      toast.error('No wallet connectors available');
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

  const handleInfoNavigation = () => {
    try {
      trackGameEvent.navigationClick('info', 'header_profile');
    } catch (error) {
      sentryTracker.userActionError(
        error instanceof Error
          ? error
          : new Error('Failed to track navigation'),
        {
          action: 'navigate_info',
          element: 'navigation_link',
          page: 'header_profile',
        }
      );
    }
  };

  const handleShareReferral = async () => {
    if (!context?.user?.fid) return;
    try {
      await sdk.actions.composeCast({
        text: 'Join me on Mini Games!',
        embeds: [`https://app.minigames.studio/?fid=${context.user.fid}`],
      });
    } catch (error) {
      console.error('Failed to share referral link:', error);
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
        className="flex items-center gap-2 bg-purple-600 hover:brightness-110 transition-all duration-200 text-white border border-white/20 rounded-2xl shadow-xl"
        variant="outline"
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? 'Connecting...' : 'Connect'}
      </Button>
    );
  }

  // Show profile drawer if connected
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <List className="w-6 h-6 text-white/70 hover:brightness-110 transition-all duration-200 cursor-pointer" />
      </DrawerTrigger>
      <DrawerContent className="bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl">
        <div className="flex flex-col h-full">
          {/* Profile Section */}
          <div className="p-6 border-b border-white/20">
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
                    className="flex items-center gap-1 text-sm text-white/70 hover:brightness-110 transition-all duration-200 self-start"
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
                <div className="flex items-center gap-4 text-xl font-semibold text-white hover:brightness-110 transition-all duration-200">
                  <Sparkles className="w-6 h-6" />
                  <span>Games</span>
                </div>
              </Link>

              <Link
                className="flex items-center gap-4 text-xl font-semibold text-white hover:brightness-110 transition-all duration-200 cursor-pointer"
                href="/leaderboard"
                onClick={handleLeaderboardNavigation}
              >
                <Trophy className="w-6 h-6" />
                <span>Leaderboard</span>
              </Link>

              <Link
                className="flex items-center gap-4 text-xl font-semibold text-white hover:brightness-110 transition-all duration-200 cursor-pointer"
                href="/info"
                onClick={handleInfoNavigation}
              >
                <InfoIcon className="w-6 h-6" />
                <span>How It Works</span>
              </Link>

              <button
                onClick={handleShareReferral}
                className="flex items-center gap-4 text-xl font-semibold text-white hover:brightness-110 transition-all duration-200"
              >
                <Share2 className="w-6 h-6" />
                <span>Invite Friends</span>
              </button>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button
              variant="outline"
              className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl text-white hover:brightness-110 transition-all duration-200"
            >
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
