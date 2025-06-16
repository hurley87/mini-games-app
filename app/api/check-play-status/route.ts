import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { Address, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { PREMIUM_THRESHOLD, FREE_PLAY_INTERVAL } from '@/lib/config';

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

export async function POST(request: NextRequest) {
  try {
    const { fid, coinId, coinAddress, walletAddress } = await request.json();

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

    // Check last play time
    const gamePlay = await supabaseService.getGamePlay(fid, coinId);
    const now = Date.now();
    const lastPlay = gamePlay?.last_played_at
      ? new Date(gamePlay.last_played_at).getTime()
      : null;

    if (!lastPlay || now - lastPlay >= FREE_PLAY_INTERVAL * 1000) {
      return NextResponse.json({
        canPlay: true,
        reason: 'first_time',
        hasPlayed: false,
        tokenBalance: '0',
        nextFreePlay: new Date(now + FREE_PLAY_INTERVAL * 1000).toISOString(),
      });
    }

    // If they have played before, check their token balance
    if (!walletAddress) {
      return NextResponse.json({
        canPlay: false,
        reason: 'no_wallet',
        hasPlayed: true,
        tokenBalance: '0',
        nextFreePlay: new Date(lastPlay + FREE_PLAY_INTERVAL * 1000).toISOString(),
      });
    }

    try {
      // Fetch token decimals and balance in parallel
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
      // Helper function to calculate 10^n using BigInt
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

      return NextResponse.json({
        canPlay: hasTokens,
        reason: hasTokens ? 'has_tokens' : 'needs_tokens',
        hasPlayed: true,
        tokenBalance: balance.toString(),
        nextFreePlay: hasTokens
          ? null
          : new Date(lastPlay + FREE_PLAY_INTERVAL * 1000).toISOString(),
      });
    } catch (balanceError) {
      console.error('Error checking token balance:', balanceError);
      // If we can't check balance, assume they don't have tokens
      return NextResponse.json({
        canPlay: false,
        reason: 'balance_check_failed',
        hasPlayed: true,
        tokenBalance: '0',
        nextFreePlay: new Date(lastPlay + FREE_PLAY_INTERVAL * 1000).toISOString(),
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
