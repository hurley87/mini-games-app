import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { createPublicClient, http, Address } from 'viem';
import { base } from 'viem/chains';
import { RateLimiter } from '@/lib/rate-limit';

const rpcUrl = process.env.RPC_URL!;

// Create a public client for reading blockchain data
const publicClient = createPublicClient({
  chain: base,
  transport: http(rpcUrl),
});

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'uint8' }],
  },
] as const;

const PREMIUM_THRESHOLD = parseInt(
  process.env.NEXT_PUBLIC_PREMIUM_THRESHOLD ?? '1000000',
  10
);

export async function POST(request: NextRequest) {
  try {
    const { fid, coinId, coinAddress, walletAddress } = await request.json();

    console.log('fid', fid);
    console.log('coinId', coinId);
    console.log('coinAddress', coinAddress);
    console.log('walletAddress', walletAddress);

    if (process.env.NODE_ENV !== 'production') {
      console.log('fid', fid);
      console.log('coinId', coinId);
      console.log('coinAddress', coinAddress);
      console.log('walletAddress', walletAddress);
    }

    if (!fid || !coinId || !coinAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: fid, coinId, coinAddress' },
        { status: 400 }
      );
    }

    // Get coin data to check max_plays
    const coin = await supabaseService.getCoinById(coinId);
    if (!coin) {
      return NextResponse.json({ error: 'Coin not found' }, { status: 404 });
    }

    // Check current daily play count
    const currentDailyPlays = await RateLimiter.getDailyPlayCount(fid, coinId);
    const maxDailyPlays = coin.max_plays || 3; // Default to 3 if not set
    const dailyPlaysRemaining = Math.max(0, maxDailyPlays - currentDailyPlays);

    // Check if player has played this game before
    const gamePlay = await supabaseService.getGamePlayRecord(fid, coinId);
    const hasPlayed = !!gamePlay;

    console.log('gamePlay', gamePlay);
    console.log('hasPlayed', hasPlayed);
    console.log('currentDailyPlays', currentDailyPlays);
    console.log('maxDailyPlays', maxDailyPlays);
    console.log('dailyPlaysRemaining', dailyPlaysRemaining);

    // Check daily play limit first (applies to everyone)
    if (currentDailyPlays >= maxDailyPlays) {
      return NextResponse.json({
        canPlay: false,
        reason: 'daily_limit_reached',
        hasPlayed,
        tokenBalance: '0',
        dailyPlaysRemaining: 0,
        maxDailyPlays,
        currentDailyPlays,
      });
    }

    // If user hasn't played before, allow free play
    if (!hasPlayed) {
      return NextResponse.json({
        canPlay: true,
        reason: 'first_time',
        hasPlayed: false,
        tokenBalance: '0',
        dailyPlaysRemaining,
        maxDailyPlays,
        currentDailyPlays,
      });
    }

    // If user has played before, check if they have a wallet and tokens
    if (!walletAddress) {
      return NextResponse.json({
        canPlay: false,
        reason: 'no_wallet',
        hasPlayed: true,
        tokenBalance: '0',
        dailyPlaysRemaining,
        maxDailyPlays,
        currentDailyPlays,
      });
    }

    const checkTokenBalance = async () => {
      const [balance, decimals] = await Promise.all([
        publicClient.readContract({
          address: coinAddress as Address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [walletAddress as Address],
        }),
        publicClient.readContract({
          address: coinAddress as Address,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }),
      ]);

      // Calculate minimum tokens: PREMIUM_THRESHOLD * 10^decimals using BigInt
      const powerOfTenBigInt = (exp: number): bigint => {
        if (exp <= 0) return BigInt(1);
        let result = BigInt(1);
        const base = BigInt(10);
        for (let i = 0; i < exp; i++) {
          result *= base;
        }
        return result;
      };

      const minimumTokens =
        BigInt(PREMIUM_THRESHOLD) * powerOfTenBigInt(Number(decimals));

      const hasTokens = balance >= minimumTokens;

      return { balance: balance.toString(), hasTokens };
    };

    try {
      const { balance, hasTokens } = await checkTokenBalance();

      console.log('balance', balance);
      console.log('hasTokens', hasTokens);

      return NextResponse.json({
        canPlay: hasTokens,
        reason: hasTokens ? 'has_tokens' : 'insufficient_tokens',
        hasPlayed: true,
        tokenBalance: balance,
        dailyPlaysRemaining,
        maxDailyPlays,
        currentDailyPlays,
      });
    } catch (balanceError) {
      console.error('Error checking token balance:', balanceError);
      // If we can't check balance, assume they don't have tokens
      return NextResponse.json({
        canPlay: false,
        reason: 'balance_check_failed',
        hasPlayed: true,
        tokenBalance: '0',
        dailyPlaysRemaining,
        maxDailyPlays,
        currentDailyPlays,
      });
    }
  } catch (error) {
    console.error('Error in check-play-status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
