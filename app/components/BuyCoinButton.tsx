'use client';

import { tradeCoinCall } from '@zoralabs/coins-sdk';
import {
  useSimulateContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { Address, parseEther, BaseError } from 'viem';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';

interface BuyCoinButtonProps {
  coinAddress: string;
  amount?: string;
  symbol: string;
  onSuccess?: () => void;
}

export function BuyCoinButton({
  coinAddress,
  amount = '0.001',
  symbol,
  onSuccess,
}: BuyCoinButtonProps) {
  const { address } = useAccount();

  // Create trade parameters
  const tradeParams = {
    direction: 'buy' as const,
    target: coinAddress as Address,
    args: {
      recipient: address as Address,
      orderSize: parseEther(amount),
      minAmountOut: BigInt(0),
      tradeReferrer: '0xbD78783a26252bAf756e22f0DE764dfDcDa7733c' as Address,
    },
  };

  // Create configuration for wagmi
  const contractCallParams = tradeCoinCall(tradeParams);

  const {
    data,
    error,
    isPending: isSimulating,
  } = useSimulateContract({
    ...contractCallParams,
    query: {
      enabled: Boolean(address && coinAddress),
    },
  });

  const hasInsufficientBalance = (error?.cause as BaseError)?.walk(
    (e: unknown) =>
      e instanceof BaseError && e.name === 'InsufficientFundsError'
  );

  const { writeContract, isPending, data: hash } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      onSuccess?.();
    }
  }, [isSuccess, onSuccess]);

  const isDisabled =
    isSimulating || isPending || isConfirming || !!hasInsufficientBalance;

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => data && writeContract(data.request)}
        disabled={isDisabled}
        className={`
          px-4 py-6 rounded-full font-medium shadow-xl shadow-purple-500/20
          ${
            isDisabled
              ? 'bg-white/10 cursor-not-allowed'
              : 'bg-purple-600 hover:brightness-110'
          }
          text-white transition-all duration-200 text-xl
        `}
      >
        {isSimulating
          ? 'Simulating...'
          : hasInsufficientBalance
            ? 'Insufficient ETH'
            : isPending
              ? 'Buying...'
              : isConfirming
                ? 'Confirming...'
                : `Buy $${symbol}`}
      </button>
    </div>
  );
}
