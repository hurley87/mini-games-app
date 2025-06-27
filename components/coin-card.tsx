'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import {
  ExternalLink,
  Copy,
  MoreHorizontal,
  Link as LinkIcon,
} from 'lucide-react';
import { CoinWithCreator } from '@/lib/types';
import { formatRelativeTime, handleViewCoin } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { trackGameEvent } from '@/lib/posthog';
import { sentryTracker } from '@/lib/sentry';
import { useBuild } from '@/hooks/useBuild';

interface CoinCardProps {
  coin: CoinWithCreator;
}

export function CoinCard({ coin }: CoinCardProps) {
  const { data: build, isLoading: buildLoading } = useBuild(coin.build_id);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopyAddress = () => {
    try {
      if (!coin.coin_address) {
        toast.error('No address available to copy');
        return;
      }
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

  const handleCopyLink = () => {
    try {
      if (!coin.id) {
        toast.error('No link available to copy');
        return;
      }
      const link = `https://app.minigames.studio/coins/${coin.id}`;
      navigator.clipboard.writeText(link);
      toast.success('Link copied to clipboard!');
      trackGameEvent.coinLinkCopy(coin.id, coin.name);
    } catch (error) {
      toast.error('Failed to copy link');
      sentryTracker.userActionError(
        error instanceof Error ? error : new Error('Failed to copy link'),
        {
          action: 'copy_link',
          element: 'coin_link',
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

  const handleViewCoinClick = async () => {
    await handleViewCoin(coin.coin_address, {
      element: 'coin_card',
      page: 'coins_list',
    });
  };

  return (
    <div className="border-b border-white/20 pb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
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
          <span className="text-white/70 text-sm">
            {formatRelativeTime(coin.created_at)}
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-white/70 hover:brightness-110 p-1 rounded-full transition-all duration-200">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-48 p-2 bg-black/20 backdrop-blur border border-white/20 rounded-2xl shadow-xl"
              align="end"
            >
              <div className="space-y-1">
                {coin.coin_address && (
                  <button
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-white/70 hover:brightness-110 transition-all duration-200 rounded-md"
                    onClick={handleCopyAddress}
                  >
                    <Copy className="w-4 h-4" />
                    Copy address
                  </button>
                )}
                {coin.id && (
                  <button
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-white/70 hover:brightness-110 transition-all duration-200 rounded-md"
                    onClick={handleCopyLink}
                  >
                    <LinkIcon className="w-4 h-4" />
                    Copy link
                  </button>
                )}
                {coin.coin_address && (
                  <Link
                    href={`https://zora.co/coin/base:${coin.coin_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDexScreenerClick}
                  >
                    <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-white/70 hover:brightness-110 transition-all duration-200 rounded-md">
                      <ExternalLink className="w-4 h-4" />
                      Trade on Zora
                    </button>
                  </Link>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Post Image with Overlay */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden">
        <Image
          src={coin.image || '/placeholder.svg?height=500&width=500'}
          alt="Post image"
          width={500}
          height={500}
          className="w-full h-full object-cover cursor-pointer"
          onError={() => {
            sentryTracker.userActionError('Failed to load game image', {
              action: 'image_load_error',
              element: 'game_image',
              page: 'coins_list',
            });
          }}
        />

        {/* Overlay with game stats */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
          {/* Top corner stats */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
            {/* Duration - Top Left */}
            {coin.duration != null && (
              <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <div className="text-white/80 text-xs font-medium">
                  Duration
                </div>
                <div className="text-white font-bold text-sm">
                  {coin.duration}min
                </div>
              </div>
            )}

            {/* Premium Threshold - Top Right */}
            {coin.premium_threshold != null && (
              <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <div className="text-white/80 text-xs font-medium">Premium</div>
                <div className="text-white font-bold text-sm">
                  {coin.premium_threshold.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex justify-between items-end mb-2">
              {/* Max earning potential - Bottom Left */}
              {coin.max_points != null && coin.token_multiplier != null && (
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <div className="text-white/80 text-xs font-medium">
                    Max Earn
                  </div>
                  <div className="text-green-400 font-bold text-sm">
                    {(coin.max_points * coin.token_multiplier).toLocaleString()}{' '}
                    {coin.symbol ? `$${coin.symbol}` : ''}
                  </div>
                </div>
              )}

              {/* Token Multiplier - Bottom Right */}
              {coin.token_multiplier != null && (
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <div className="text-white/80 text-xs font-medium">
                    Multiplier
                  </div>
                  <div className="text-purple-400 font-bold text-sm">
                    {coin.token_multiplier}x
                  </div>
                </div>
              )}
            </div>

            {/* Game Title */}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 mt-4">
        {coin.name && (
          <h3 className="text-white font-bold truncate">{coin.name}</h3>
        )}
        <div className="text-white/70 text-sm">
          {buildLoading ? (
            <p>Loading tutorial...</p>
          ) : (
            <>
              <p
                className={`${
                  isExpanded ? '' : 'line-clamp-2'
                } transition-all duration-200`}
              >
                {build?.tutorial ||
                  coin.description ||
                  'No description available'}
              </p>
              {(build?.tutorial || coin.description) &&
                (build?.tutorial || coin.description || '').length > 100 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-purple-400 hover:text-purple-300 text-xs mt-1 transition-colors"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
            </>
          )}
        </div>
      </div>
      {coin.id && (
        <Link href={`/coins/${coin.id}`}>
          <button className="bg-purple-600 text-white rounded-full font-semibold w-full mt-4 text-xl py-4 hover:brightness-110 transition-all duration-200 shadow-xl">
            View Game
          </button>
        </Link>
      )}

      {/* Post Actions */}
      {coin.name && coin.symbol && (
        <div className="flex items-center justify-center pt-4 gap-1">
          Play {coin.name}, earn
          <span
            onClick={handleViewCoinClick}
            className="text-purple-400 cursor-pointer"
          >
            ${coin.symbol}
          </span>
        </div>
      )}
    </div>
  );
}
