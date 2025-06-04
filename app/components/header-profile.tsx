'use client';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/app/components/ui/drawer';
import { Button } from '@/app/components/ui/button';
import Image from 'next/image';
<<<<<<< HEAD
import {
  List,
  LogOut,
  Settings,
  Trophy,
  UserPlus,
  Wallet,
  Copy,
} from 'lucide-react';
=======
import { Sparkles, LogOut, Trophy, Wallet, List } from 'lucide-react';
>>>>>>> 5b4dcd23142cb996c71bb4023aaf0b9f3035f4f0
import { sdk } from '@farcaster/frame-sdk';
import { useState } from 'react';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';

export function HeaderProfile() {
  const { context, isLoading } = useFarcasterContext();
  const { address } = useAccount();
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
  const userDisplayName = context?.user?.username || 'Anonymous';
  const userPfp = context?.user?.pfpUrl;

  // Show connect button if not connected
  if (!isLoading && !isConnected) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-2"
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
<<<<<<< HEAD
        <button className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
            {userPfp ? (
              <Image
                src={userPfp}
                alt={`${userDisplayName} avatar`}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xs">
                {isLoading ? '...' : userDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">
              {isLoading ? 'Loading...' : userDisplayName}
            </span>
            {address && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyAddress(address);
                }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span>{formatAddress(address)}</span>
                <Copy className="w-3 h-3" />
              </button>
            )}
          </div>
        </button>
=======
        <List className="w-6 h-6 text-gray-400" />
>>>>>>> 5b4dcd23142cb996c71bb4023aaf0b9f3035f4f0
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
                {userPfp ? (
                  <Image
                    src={userPfp}
                    alt={`${userDisplayName} avatar`}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xs">
                    {userDisplayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span>{userDisplayName}</span>
            </div>
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col h-full">
          <div className="flex-1 p-6">
            {/* Menu Items */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-xl font-semibold">
                <Sparkles className="w-6 h-6" />
                <span>Games</span>
              </div>

              <div className="flex items-center gap-4 text-xl font-semibold">
                <Trophy className="w-6 h-6" />
                <span>Leaderboard</span>
              </div>

              <div className="flex items-center gap-4 text-xl font-semibold">
                <LogOut className="w-6 h-6" />
                <span>Log out</span>
              </div>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
