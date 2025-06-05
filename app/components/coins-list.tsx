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
import { formatRelativeTime, formatCurrency, formatHolders } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

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
      <div className="flex items-center justify-center min-h-[400px] bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-8 bg-gray-900">
        <p>{error}</p>
      </div>
    );
  }

  console.log('coins', coins);

  return (
    <main className="flex-1 overflow-auto container mx-auto px-4 py-12 max-w-6xl pt-20 bg-gray-900">
      {coins.map((coin) => (
        <div key={coin.id} className="border-b border-gray-700 pb-4">
          {/* Post Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
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
          />

          {/* Post Actions */}
          <div className="flex items-center justify-between px-4 py-3">
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
            <Link href={`/coins/${coin.id}`}>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 rounded-full font-bold transition-colors">
                Play
              </button>
            </Link>
          </div>

          {/* Post Title */}
          <div className="px-4 pb-2">
            <h2 className="text-sm font-bold text-white">{coin.name}</h2>
          </div>
        </div>
      ))}
    </main>
  );
}
