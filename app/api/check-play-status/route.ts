import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { Address, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// Create a public client for reading blockchain data
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
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

    // Check if player has played this game before
    const hasPlayed = await supabaseService.hasPlayerPlayedGame(fid, coinId);

    // If they haven't played before, they can play for free
    if (!hasPlayed) {
      return NextResponse.json({
        canPlay: true,
        reason: 'first_time',
        hasPlayed: false,
        tokenBalance: '0',
      });
    }

    // If they have played before, check their token balance
    if (!walletAddress) {
      return NextResponse.json({
        canPlay: false,
        reason: 'no_wallet',
        hasPlayed: true,
        tokenBalance: '0',
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

      // Calculate minimum tokens: 0.001 * 10^decimals using BigInt to avoid floating-point precision issues
      // 0.001 = 1 / 1000, so we need 10^(decimals-3) tokens
      const exponent = Number(decimals) - 3;

      // Helper function to calculate 10^n using BigInt to maintain precision for high decimals
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
        exponent >= 0
          ? powerOfTenBigInt(exponent) // For decimals >= 3
          : BigInt(1); // For decimals < 3, minimum is 1 unit
      const hasTokens = balance >= minimumTokens;

      return NextResponse.json({
        canPlay: hasTokens,
        reason: hasTokens ? 'has_tokens' : 'needs_tokens',
        hasPlayed: true,
        tokenBalance: balance.toString(),
      });
    } catch (balanceError) {
      console.error('Error checking token balance:', balanceError);
      // If we can't check balance, assume they don't have tokens
      return NextResponse.json({
        canPlay: false,
        reason: 'balance_check_failed',
        hasPlayed: true,
        tokenBalance: '0',
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
