import { unstable_cache } from 'next/cache';
import { getCoin } from '@zoralabs/coins-sdk';
import { base } from 'viem/chains';
import { supabaseService } from '@/lib/supabase';
import { Coin, CoinWithCreator, ZoraCoinData } from '@/lib/types';
import { CoinCard } from './coin-card';

async function fetchZoraCoinData(
  coinAddress: string
): Promise<ZoraCoinData | undefined> {
  try {
    const response = await getCoin({ address: coinAddress, chain: base.id });
    const zoraCoin = response.data?.zora20Token;
    if (!zoraCoin) return undefined;
    return {
      volume24h: zoraCoin.volume24h,
      marketCap: zoraCoin.marketCap,
      uniqueHolders: zoraCoin.uniqueHolders,
    };
  } catch (error) {
    console.error(`Failed to fetch Zora data for coin ${coinAddress}:`, error);
    return undefined;
  }
}

const getCoinsWithData = unstable_cache(
  async () => {
    const coins: Coin[] = await supabaseService.getCoins();
    const coinsWithCreators: CoinWithCreator[] = await Promise.all(
      coins.map(async (coin) => {
        const [creatorResult, zoraResult] = await Promise.allSettled([
          supabaseService.getCreatorByFID(coin.fid),
          fetchZoraCoinData(coin.coin_address),
        ]);

        let creator = null;
        if (creatorResult.status === 'fulfilled') {
          creator = creatorResult.value[0] || null;
        } else {
          console.error(
            `Failed to fetch creator for coin ${coin.fid}:`,
            creatorResult.reason
          );
        }

        let zoraData: ZoraCoinData | undefined = undefined;
        if (zoraResult.status === 'fulfilled') {
          zoraData = zoraResult.value;
        } else {
          console.error(
            `Failed to fetch Zora data for coin ${coin.coin_address}:`,
            zoraResult.reason
          );
        }

        return {
          ...coin,
          creator,
          zoraData,
        } as CoinWithCreator;
      })
    );
    return coinsWithCreators;
  },
  ['coins-with-data'],
  { revalidate: 300 }
);

export async function CoinsList() {
  let coins: CoinWithCreator[] = [];
  try {
    coins = await getCoinsWithData();
  } catch (error) {
    console.error('Error fetching coins with creators and Zora data:', error);
    return (
      <div className="text-center text-red-400 py-8 bg-black/20 backdrop-blur rounded-2xl border border-white/20 shadow-xl mx-4 mt-4">
        <p>Failed to load coins</p>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-auto container mx-auto px-4 py-12 pt-20 flex flex-col gap-4">
      {coins.map((coin) => (
        <CoinCard key={coin.id} coin={coin} />
      ))}
    </main>
  );
}
