'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ExternalLink,
  Copy,
  MoreHorizontal,
  Link as LinkIcon,
} from 'lucide-react';
import { CoinWithCreator } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { trackGameEvent } from '@/lib/posthog';
import { sentryTracker } from '@/lib/sentry';
import sdk from '@farcaster/frame-sdk';

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

  const handleCopyLink = () => {
    try {
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

  const handleViewCoin = async () => {
    try {
      await sdk.actions.viewToken({
        token: `eip155:8453/erc20:${coin.coin_address}`,
      });
    } catch (error) {
      sentryTracker.userActionError(
        error instanceof Error ? error : new Error('Failed to track view coin'),
        {
          action: 'view_coin',
          element: 'coin_card',
          page: 'coins_list',
        }
      );
    }
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
                <button
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-white/70 hover:brightness-110 transition-all duration-200 rounded-md"
                  onClick={handleCopyAddress}
                >
                  <Copy className="w-4 h-4" />
                  Copy address
                </button>
                <button
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-white/70 hover:brightness-110 transition-all duration-200 rounded-md"
                  onClick={handleCopyLink}
                >
                  <LinkIcon className="w-4 h-4" />
                  Copy link
                </button>
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
          className="bg-purple-600 text-white rounded-full font-semibold w-full mt-4 text-xl py-4 hover:brightness-110 transition-all duration-200 shadow-xl"
          onClick={handleGameCardView}
        >
          {coin.name}
        </button>
      </Link>

      {/* Post Actions */}
      <div className="flex items-center justify-center py-4 ">
        Play {coin.name}, earn{' '}
        <span onClick={handleViewCoin} className="text-purple-400">
          ${coin.symbol}
        </span>{' '}
        tokens
      </div>
    </div>
  );
}
