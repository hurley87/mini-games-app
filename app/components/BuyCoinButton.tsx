'use client';

import { tradeCoin } from "@zoralabs/coins-sdk";
import { parseEther } from "viem";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useState } from "react";
import { getWalletClients } from "@/lib/clients";
import { useAccount } from "wagmi";

interface BuyCoinButtonProps {
  coinAddress: string;
  amount?: string;
  onSuccess?: () => void;
}

export function BuyCoinButton({ coinAddress, amount = "0.001", onSuccess }: BuyCoinButtonProps) {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!address) {
        throw new Error("Please connect your wallet first");
      }

      // Get wallet clients
      const { walletClient, publicClient } = await getWalletClients();

      // Create trade parameters
      const params = {
        direction: "buy" as const,
        target: coinAddress as `0x${string}`,
        args: {
          recipient: address,
          orderSize: parseEther(amount),
          minAmountOut: BigInt(0),
          tradeReferrer: process.env.PLATFORM_REFERRER as `0x${string}`,
        }
      };

      // Execute the trade
      const tradeResult = await tradeCoin(params, walletClient, publicClient);
      console.log('Trade result:', tradeResult);

      // Call onSuccess callback if provided
      onSuccess?.();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to buy coin");
      console.error("Error buying coin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleBuy}
        disabled={isLoading}
        className={`
          px-4 py-2 rounded-md font-medium
          ${isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
          }
          text-white transition-colors
        `}
      >
        {isLoading ? 'Buying...' : `Buy ${amount} ETH`}
      </button>
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
} 