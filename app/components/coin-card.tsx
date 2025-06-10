'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ExternalLink,
  Copy,
  MoreHorizontal,
  TrendingUp,
  DollarSign,
  Users,
} from 'lucide-react';
import { CoinWithCreator } from '@/lib/types';
import { formatRelativeTime, formatCurrency, formatHolders } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { trackGameEvent } from '@/lib/posthog';
import { sentryTracker } from '@/lib/sentry';

interface CoinCardProps {
  coin: CoinWithCreator;
}

export function CoinCard({ coin }: CoinCardProps) {
  const handleCopyAddress = () => {
    try {
      navigator.clipboard.writeText(coin.coin_address);
      toast.success('Address copied to clipboard!');
      trackGameEvent.coinAddressCopy(coin.coin_address, coin.name);
    } catch (error) {
      toast.error('Failed to copy address');
      sentryTracker.userActionError(
        error instanceof Error ? error : new Error('Failed to copy address'),
        {
          action: 'copy_address',
          element: 'coin_address',
          page: 'coins_list',
        }
      );
    }
  };

  const handleDexScreenerClick = () => {
    try {
      trackGameEvent.dexScreenerClick(coin.coin_address, coin.name);
    } catch (error) {
      sentryTracker.userActionError(
        error instanceof Error
          ? error
          : new Error('Failed to track dex screener click'),
        {
          action: 'dex_screener_click',
          element: 'external_link',
          page: 'coins_list',
        }
      );
    }
  };

  const handleGameCardView = () => {
    try {
      trackGameEvent.gameCardView(
        coin.id,
        coin.name,
        coin.creator?.username || `Creator ${coin.fid}`
      );
    } catch (error) {
      sentryTracker.userActionError(
        error instanceof Error
          ? error
          : new Error('Failed to track game card view'),
        {
          action: 'game_card_view',
          element: 'game_card',
          page: 'coins_list',
        }
      );
    }
  };

  return (
    <div className="border-b border-gray-700 pb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
              <Image
                src={coin.creator?.pfp || '/placeholder.svg?height=40&width=40'}
                alt={`${coin.creator?.username || 'Creator'} profile`}
                width={40}
                height={40}
                className="object-cover"
                onError={() => {
                  sentryTracker.userActionError(
                    'Failed to load creator profile image',
                    {
                      action: 'image_load_error',
                      element: 'creator_pfp',
                      page: 'coins_list',
                    }
                  );
                }}
              />
            </div>
          </div>
          <span className="font-bold text-white">
            {coin.creator?.username || `Creator ${coin.fid}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">
            {formatRelativeTime(coin.created_at)}
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-gray-400 hover:text-gray-200 p-1 rounded-full hover:bg-gray-700 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-48 p-2 bg-gray-800 border border-gray-700"
              align="end"
            >
              <div className="space-y-1">
                <button
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
                  onClick={handleCopyAddress}
                >
                  <Copy className="w-4 h-4" />
                  Copy address
                </button>
                <Link
                  href={`https://dexscreener.com/base/${coin.coin_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleDexScreenerClick}
                >
                  <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    DEX Screener
                  </button>
                </Link>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Post Image */}
      <Image
        src={coin.image || '/placeholder.svg?height=500&width=500'}
        alt="Post image"
        width={500}
        height={500}
        className="w-full aspect-square object-cover rounded-xl"
        onClick={handleGameCardView}
        onError={() => {
          sentryTracker.userActionError('Failed to load game image', {
            action: 'image_load_error',
            element: 'game_image',
            page: 'coins_list',
          });
        }}
      />

      <Link href={`/coins/${coin.id}`}>
        <button
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors w-full mt-4 text-xl py-4"
          onClick={handleGameCardView}
        >
          Play
        </button>
      </Link>

      {/* Post Title */}
      <div className="px-4 pb-2 mt-4">
        <h2 className="text-sm font-bold text-white">{coin.name}</h2>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between px-4 ">
        <div className="flex items-center gap-4">
          {/* Zora Data Metrics */}
          <div className="flex items-center gap-3 text-sm">
            {/* 24h Volume */}
            <div className="flex items-center gap-1 text-purple-400">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">
                {formatCurrency(coin.zoraData?.volume24h)}
              </span>
            </div>
            {/* Market Cap */}
            <div className="flex items-center gap-1 text-emerald-400">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">
                {formatCurrency(coin.zoraData?.marketCap)}
              </span>
            </div>
            {/* Unique Holders */}
            <div className="flex items-center gap-1 text-blue-400">
              <Users className="w-4 h-4" />
              <span className="font-medium">
                {formatHolders(coin.zoraData?.uniqueHolders)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
