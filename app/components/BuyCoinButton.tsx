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

  // Calculate token amount in base units using actual decimals
  const calculateTokenAmount = (
    tokenAmount: string,
    tokenDecimals: number
  ): bigint => {
    const numAmount = parseFloat(tokenAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return BigInt(0);
    }

    // Convert to base units: amount * 10^decimals
    const multiplier = BigInt(10 ** tokenDecimals);
    const integerPart = Math.floor(numAmount);
    const fractionalPart = numAmount - integerPart;

    // Handle integer part
    let result = BigInt(integerPart) * multiplier;

    // Handle fractional part by converting to string and processing
    if (fractionalPart > 0) {
      const fractionalStr = fractionalPart.toFixed(tokenDecimals).slice(2); // Remove "0."
      const fractionalBigInt = BigInt(fractionalStr || '0');
      result += fractionalBigInt;
    }

    return result;
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
