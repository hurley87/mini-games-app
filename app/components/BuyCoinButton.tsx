'use client';

import { tradeCoinCall } from "@zoralabs/coins-sdk";
import { useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Address, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useEffect } from "react";

interface BuyCoinButtonProps {
  coinAddress: string;
  amount?: string;
  onSuccess?: () => void;
}

export function BuyCoinButton({ coinAddress, amount = "0.001", onSuccess }: BuyCoinButtonProps) {
  const { address } = useAccount();

  // Create trade parameters
  const tradeParams = {
    direction: "buy" as const,
    target: coinAddress as Address,
    args: {
      recipient: address as Address,
      orderSize: parseEther(amount),
      minAmountOut: BigInt(0),
      tradeReferrer: process.env.PLATFORM_REFERRER as Address,
    }
  };

  // Create configuration for wagmi
  const contractCallParams = tradeCoinCall(tradeParams);

  const { data } = useSimulateContract({
    ...contractCallParams,
    value: tradeParams.args.orderSize,
  });

  const { writeContract, isPending, data: hash } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash
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
        disabled={!Boolean(data?.request)}
        className={`
          px-4 py-2 rounded-md font-medium
          ${!Boolean(data?.request) 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
          }
          text-white transition-colors
        `}
      >
        {isPending ? 'Buying...' : isConfirming ? 'Confirming...' : `Buy ${amount} ETH`}
      </button>
    
    </div>
  );
} 