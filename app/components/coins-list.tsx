'use client';

import { useEffect, useState } from 'react';
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
import { formatRelativeTime } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

/**
 * Formats a currency value for display
 */
const formatCurrency = (value: string | undefined): string => {
  if (!value || value === '0') return 'N/A';

  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';

  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `${(num / 1e3).toFixed(1)}K`;
  } else {
    return `${num.toFixed(2)}`;
  }
};

/**
 * Formats holder count for display
 */
const formatHolders = (count: number | undefined): string => {
  if (!count) return 'N/A';

  if (count >= 1e6) {
    return `${(count / 1e6).toFixed(1)}M`;
  } else if (count >= 1e3) {
    return `${(count / 1e3).toFixed(1)}K`;
  } else {
    return count.toString();
  }
};

export function CoinsList() {
  const [coins, setCoins] = useState<CoinWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoinsWithCreators = async () => {
      try {
        const response = await fetch('/api/coins');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const coinsData: CoinWithCreator[] = await response.json();
        setCoins(coinsData);
      } catch (err) {
        setError('Failed to load coins');
        console.error('Error fetching coins:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoinsWithCreators();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        <p>{error}</p>
      </div>
    );
  }

  console.log('coins', coins);

  return (
    <main className="flex-1 overflow-auto container mx-auto px-4 py-12 max-w-6xl pt-20">
      {coins.map((coin) => (
        <div key={coin.id} className="border-b pb-4">
          {/* Post Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                  <Image
                    src={
                      coin.creator?.pfp || '/placeholder.svg?height=40&width=40'
                    }
                    alt={`${coin.creator?.username || 'Creator'} profile`}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
              </div>
              <span className="font-bold">
                {coin.creator?.username || `Creator ${coin.fid}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">
                {formatRelativeTime(coin.created_at)}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                  <div className="space-y-1">
                    <button
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(coin.coin_address);
                        toast.success('Address copied to clipboard!');
                      }}
                    >
                      <Copy className="w-4 h-4" />
                      Copy address
                    </button>
                    <Link
                      href={`https://dexscreener.com/base/${coin.coin_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
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
          />

          {/* Post Actions */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Zora Data Metrics */}
              <div className="flex items-center gap-3 text-sm">
                {/* 24h Volume */}
                <div className="flex items-center gap-1 text-blue-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">
                    {formatCurrency(coin.zoraData?.volume24h)}
                  </span>
                </div>

                {/* Market Cap */}
                <div className="flex items-center gap-1 text-green-600">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">
                    {formatCurrency(coin.zoraData?.marketCap)}
                  </span>
                </div>

                {/* Unique Holders */}
                <div className="flex items-center gap-1 text-purple-600">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">
                    {formatHolders(coin.zoraData?.uniqueHolders)}
                  </span>
                </div>
              </div>
            </div>
            <Link href={`/coins/${coin.id}`}>
              <button className="bg-green-500 text-white px-8 py-2 rounded-full font-bold">
                Play
              </button>
            </Link>
          </div>

          {/* Post Title */}
          <div className="px-4 pb-2">
            <h2 className="text-sm font-bold">{coin.name}</h2>
          </div>
        </div>
      ))}
    </main>
  );
}
