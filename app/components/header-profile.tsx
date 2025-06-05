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
import { List, LogOut, Trophy, Wallet, Copy, Sparkles } from 'lucide-react';
import { sdk } from '@farcaster/frame-sdk';
import { useState } from 'react';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';
import { toast } from 'sonner';
import { useAccount, useDisconnect } from 'wagmi';
import Link from 'next/link';

export function HeaderProfile() {
  const { context, isLoading } = useFarcasterContext();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Trigger Farcaster connection
      await sdk.actions.openUrl('https://warpcast.com');
      // You might need to implement specific connection logic here
      // depending on your Farcaster Frame setup
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = () => {
    try {
      // Disconnect wallet
      disconnect();
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Failed to logout:', error);
      toast.error('Failed to logout');
    }
  };

  // Helper function to format address
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Helper function to copy address
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard!');
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
              <Link href="/">
                <div className="flex items-center gap-4 text-xl font-semibold text-white hover:text-purple-400 transition-colors">
                  <Sparkles className="w-6 h-6" />
                  <span>Games</span>
                </div>
              </Link>

              <Link
                className="flex items-center gap-4 text-xl font-semibold text-white hover:text-purple-400 transition-colors cursor-pointer"
                href="/leaderboard"
              >
                <Trophy className="w-6 h-6" />
                <span>Leaderboard</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-4 text-xl font-semibold text-white hover:text-red-400 transition-colors cursor-pointer w-full text-left"
              >
                <LogOut className="w-6 h-6" />
                <span>Log out</span>
              </button>
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
