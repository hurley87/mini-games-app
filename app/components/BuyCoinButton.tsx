'use client';

import { tradeCoinCall } from '@zoralabs/coins-sdk';
import {
  useSimulateContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';

interface BuyCoinButtonProps {
  coinAddress: string;
  amount?: string;
  symbol: string;
  decimals: number;
  onSuccess?: () => void;
}

export function BuyCoinButton({
  coinAddress,
  amount = '0.001',
  symbol,
  decimals,
  onSuccess,
}: BuyCoinButtonProps) {
  const { address } = useAccount();

  // Calculate token amount in base units using string-based arithmetic to avoid floating-point precision issues
  const calculateTokenAmount = (
    tokenAmount: string,
    tokenDecimals: number
  ): bigint => {
    // Remove leading/trailing whitespace and validate input
    const cleanAmount = tokenAmount.trim();

    if (!cleanAmount || cleanAmount === '0' || cleanAmount === '0.') {
      return BigInt(0);
    }

    // Check for valid decimal format (positive numbers only)
    if (!/^\d+(\.\d+)?$/.test(cleanAmount)) {
      return BigInt(0);
    }

    // Split into integer and decimal parts
    const [integerPart = '0', decimalPart = ''] = cleanAmount.split('.');

    // Pad decimal part with zeros to match token decimals, or truncate if too long
    let adjustedDecimalPart = decimalPart.padEnd(tokenDecimals, '0');

    // If input has more decimals than token supports, truncate (don't round to avoid precision loss)
    if (adjustedDecimalPart.length > tokenDecimals) {
      adjustedDecimalPart = adjustedDecimalPart.slice(0, tokenDecimals);
    }

    // Combine integer and decimal parts to create the full amount string
    const fullAmountStr = integerPart + adjustedDecimalPart;

    // Convert to BigInt, handling potential conversion errors
    try {
      const result = BigInt(fullAmountStr);
      return result > BigInt(0) ? result : BigInt(0);
    } catch {
      return BigInt(0);
    }
  };

  // Create trade parameters
  const tradeParams = {
    direction: 'buy' as const,
    target: coinAddress as Address,
    args: {
      recipient: address as Address,
      orderSize: calculateTokenAmount(amount, decimals),
      minAmountOut: BigInt(0),
      tradeReferrer: '0xbD78783a26252bAf756e22f0DE764dfDcDa7733c' as Address,
    },
  };

  // Create configuration for wagmi
  const contractCallParams = tradeCoinCall(tradeParams);

  const { data } = useSimulateContract({
    ...contractCallParams,
    query: {
      enabled: Boolean(address && coinAddress),
    },
  });

  const { writeContract, isPending, data: hash } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      onSuccess?.();
    }
  }, [isSuccess, onSuccess]);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => writeContract(data!.request)}
        disabled={!data?.request || isPending || isConfirming}
        className={`
          px-4 py-6 rounded-full font-medium shadow-xl shadow-purple-500/20
          ${
            !data?.request || isPending || isConfirming
              ? 'bg-white/10 cursor-not-allowed'
              : 'bg-purple-600 hover:brightness-110'
          }
          text-white transition-all duration-200 text-xl
        `}
      >
        {isPending
          ? 'Buying...'
          : isConfirming
            ? 'Confirming...'
            : `Buy $${symbol}`}
      </button>
    </div>
  );
}
