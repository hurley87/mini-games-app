'use client';

import { useState, useEffect } from 'react';
import { Info } from './info';
import { Game } from './game';
import { getCoin } from '@zoralabs/coins-sdk';
import { base } from 'viem/chains';
import { ZoraCoinData, Creator } from '@/lib/types';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from './ui/button';

interface GameWrapperProps {
  id: string;
  name: string;
  description: string;
  timeoutSeconds?: number;
  coinAddress: string;
  imageUrl?: string;
  symbol: string;
  zoraData?: ZoraCoinData;
  fid: number;
  creator?: Creator;
}

export function GameWrapper({
  id,
  name,
  description,
  timeoutSeconds = 10,
  coinAddress,
  imageUrl,
  symbol,
  zoraData,
  fid,
  creator,
}: GameWrapperProps) {
  const [showGame, setShowGame] = useState(false);
  const [fetchedZoraData, setFetchedZoraData] = useState<
    ZoraCoinData | undefined
  >(zoraData);
  const [isLoadingZoraData, setIsLoadingZoraData] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timeoutSeconds);

  // Fetch Zora data if not provided
  useEffect(() => {
    async function fetchZoraCoinData() {
      if (fetchedZoraData || !coinAddress) return;

      setIsLoadingZoraData(true);
      try {
        const response = await getCoin({
          address: coinAddress,
          chain: base.id,
        });

        const zoraCoin = response.data?.zora20Token;
        if (zoraCoin) {
          setFetchedZoraData({
            volume24h: zoraCoin.volume24h,
            marketCap: zoraCoin.marketCap,
            uniqueHolders: zoraCoin.uniqueHolders,
          });
        }
      } catch (error) {
        console.error(
          `Failed to fetch Zora data for coin ${coinAddress}:`,
          error
        );
      } finally {
        setIsLoadingZoraData(false);
      }
    }

    fetchZoraCoinData();
  }, [coinAddress, fetchedZoraData]);

  // Timeout countdown effect
  useEffect(() => {
    if (!showGame || !timeoutSeconds) return;

    setRemainingTime(timeoutSeconds);
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          setShowGame(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showGame, timeoutSeconds]);

  if (isLoadingZoraData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-purple-500"></div>
          <div className="text-gray-300">Loading...</div>
        </div>
      </div>
    );
  }

  if (showGame) {
    return (
      <div className="flex flex-col h-full">
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-2 border-b border-gray-700 bg-gray-900">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGame(false)}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-100"
          >
            <ArrowLeft size={20} />
            <span>Exit</span>
          </Button>

          {timeoutSeconds && (
            <div className="flex items-center gap-2 text-gray-400">
              <Clock size={16} />
              <span className="text-sm font-mono">
                {Math.floor(remainingTime / 60)}:
                {(remainingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </header>
        <div className="flex-1 pt-16">
          <Game
            id={id}
            timeoutSeconds={timeoutSeconds}
            coinAddress={coinAddress}
          />
        </div>
      </div>
    );
  }

  console.log('fetchedZoraData', fetchedZoraData);

  return (
    <Info
      id={id}
      name={name}
      description={description}
      coinAddress={coinAddress}
      imageUrl={imageUrl}
      symbol={symbol}
      zoraData={fetchedZoraData}
      fid={fid}
      creator={creator}
      onPlay={() => setShowGame(true)}
    />
  );
}
