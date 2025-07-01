import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, Address } from 'viem';
import { base } from 'viem/chains';

const rpcUrl = process.env.RPC_URL!;

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
    const { coinAddress, walletAddress } = await request.json();

    if (!coinAddress || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing coinAddress or walletAddress' },
        { status: 400 }
      );
    }

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

    const formatted = Number(balance) / 10 ** Number(decimals);

    return NextResponse.json({ balance: formatted.toString() });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
