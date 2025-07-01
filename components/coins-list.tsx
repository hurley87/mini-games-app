import { unstable_cache } from 'next/cache';
import { supabaseService } from '@/lib/supabase';
import { Coin, CoinWithCreator } from '@/lib/types';
import { CoinCard } from './coin-card';

const getCoinsWithData = unstable_cache(
  async () => {
    const coins: Coin[] = await supabaseService.getCoins();
    console.log('coins', coins);
    const coinsWithCreators: CoinWithCreator[] = await Promise.all(
      coins.map(async (coin) => {
        try {
          const creator = await supabaseService.getCreatorByFID(coin.fid);
          return {
            ...coin,
            creator: creator[0] || undefined,
          } as CoinWithCreator;
        } catch (error) {
          console.error(`Failed to fetch creator for coin ${coin.fid}:`, error);
          return {
            ...coin,
            creator: undefined,
          } as CoinWithCreator;
        }
      })
    );
    console.log('coinsWithCreators', coinsWithCreators);
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
    console.error('Error fetching coins with creators:', error);
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
