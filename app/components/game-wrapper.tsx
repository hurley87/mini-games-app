'use client';

import { useState, useEffect } from 'react';
import { Info } from './info';
import { Game } from './game';
import { getCoin } from '@zoralabs/coins-sdk';
import { base } from 'viem/chains';
import { ZoraCoinData, Creator } from '@/lib/types';

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

  if (isLoadingZoraData) {
    return <div>Loading...</div>;
  }

  if (showGame) {
    return (
      <Game id={id} timeoutSeconds={timeoutSeconds} coinAddress={coinAddress} />
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
