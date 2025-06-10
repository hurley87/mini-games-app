'use client';

import { tradeCoinCall } from '@zoralabs/coins-sdk';
import {
  useSimulateContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { Address, parseEther } from 'viem';
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
  amount = '0.0005',
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
          px-4 py-6 rounded-2xl font-medium shadow-xl shadow-purple-500/20
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
