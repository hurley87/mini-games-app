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
] as const;

export async function POST(request: NextRequest) {
  try {
    const { fid, coinId, coinAddress, walletAddress } = await request.json();

    console.log('fid', fid);
    console.log('coinId', coinId);
    console.log('coinAddress', coinAddress);
    console.log('walletAddress', walletAddress);

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
      const balance = await publicClient.readContract({
        address: coinAddress as Address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress as Address],
      });

      const hasTokens = balance > BigInt(0);

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
