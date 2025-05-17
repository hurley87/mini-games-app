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

  console.log('address', address);

  // Create trade parameters
  const tradeParams = {
    direction: "buy" as const,
    target: coinAddress as Address,
    args: {
      recipient: address as Address,
      orderSize: parseEther(amount),
      minAmountOut: BigInt(0),
      tradeReferrer: "0xbD78783a26252bAf756e22f0DE764dfDcDa7733c" as Address,
    }
  };

  console.log('tradeParams', tradeParams);

  // Create configuration for wagmi
  const contractCallParams = tradeCoinCall(tradeParams);

  const { data, error } = useSimulateContract({
    ...contractCallParams,
    query: {
      enabled: Boolean(address && coinAddress),
    }
  });

  console.log('simulation data:', data);
  console.log('simulation error:', error);

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
        disabled={!data?.request || isPending || isConfirming}
        className={`
          px-4 py-2 rounded-md font-medium
          ${!data?.request || isPending || isConfirming
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