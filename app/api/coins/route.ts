import { supabaseService } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { Coin, CoinWithCreator, ZoraCoinData } from '@/lib/types';
import { getCoin } from '@zoralabs/coins-sdk';
import { base } from 'viem/chains';

export const dynamic = 'force-dynamic';

/**
 * Fetches additional coin data from Zora using the coin address
 */
async function fetchZoraCoinData(
  coinAddress: string
): Promise<ZoraCoinData | undefined> {
  try {
    const response = await getCoin({
      address: coinAddress,
      chain: base.id, // Default to Base chain
    });

    const zoraCoin = response.data?.zora20Token;

    if (!zoraCoin) {
      return undefined;
    }

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

export async function GET() {
  try {
    // Fetch all coins from our database
    const coins: Coin[] = await supabaseService.getCoins();

    // Fetch creator data and Zora data for each coin in parallel
    const coinsWithCreators: CoinWithCreator[] = await Promise.all(
      coins.map(async (coin: Coin) => {
        // Fetch creator and Zora data in parallel
        const [creatorResult, zoraData] = await Promise.allSettled([
          supabaseService.getCreatorByFID(coin.fid),
          fetchZoraCoinData(coin.coin_address),
        ]);

        // Handle creator data
        let creator = null;
        if (creatorResult.status === 'fulfilled') {
          creator = creatorResult.value[0] || null;
        } else {
          console.error(
            `Failed to fetch creator for coin ${coin.fid}:`,
            creatorResult.reason
          );
        }

        // Handle Zora data
        let zoraCoinData: ZoraCoinData | undefined = undefined;
        if (zoraData.status === 'fulfilled') {
          zoraCoinData = zoraData.value;
        } else {
          console.error(
            `Failed to fetch Zora data for coin ${coin.coin_address}:`,
            zoraData.reason
          );
        }

        return {
          ...coin,
          creator,
          zoraData: zoraCoinData,
        };
      })
    );

    return NextResponse.json(coinsWithCreators);
  } catch (error) {
    console.error('Error fetching coins with creators and Zora data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coins with creators and Zora data' },
      { status: 500 }
    );
  }
}
