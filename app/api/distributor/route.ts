import {
  createClientForWallet,
  getPublicClient,
  getWalletAccount,
} from '@/lib/clients';
import { supabaseService } from '@/lib/supabase';
import { SendNotificationRequest } from '@farcaster/frame-node';
import { NextResponse } from 'next/server';

// Route configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Main API route handler
export async function POST(request: Request) {
  try {
    const pendingTransfers =
      await supabaseService.getPendingScoresGroupedByToken();

    for (const transfer of pendingTransfers) {
      const { data: coin, error: coinError } = await supabaseService
        .from('coins')
        .select('*')
        .eq('id', transfer.coin_id)
        .single();

      console.log('coin', coin);

      const fid = transfer.fid;
      console.log('fid', fid);

      const tokenCount = transfer.total_score;
      console.log('tokenCount', tokenCount);

      if (coinError) {
        console.error('Error getting coin:', coinError);
        continue;
      }

      const coinAddress = coin.coin_address;

      console.log('coinAddress', coinAddress);

      const account = await getWalletAccount(
        coin.wallet_id,
        coin.wallet_address
      );

      const walletClient = createClientForWallet(account);

      const player = await supabaseService.getPlayerByFid(fid);

      if (!player) {
        console.log('Player not found');
        continue;
      }

      console.log('player', player);

      const playerWalletAddress = player[0].wallet_address;

      if (!playerWalletAddress) {
        console.log('Player wallet address not found');
        continue;
      }

      console.log('playerWalletAddress', playerWalletAddress);

      try {
        // Transfer tokens using ERC-20 transfer function
        const hash = await walletClient.writeContract({
          address: coinAddress as `0x${string}`,
          abi: [
            {
              name: 'transfer',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' },
              ],
              outputs: [{ name: '', type: 'bool' }],
            },
          ] as const,
          functionName: 'transfer',
          args: [
            playerWalletAddress as `0x${string}`,
            BigInt(tokenCount) * BigInt(10 ** 18),
          ],
          account: account,
          chain: walletClient.chain,
        });
        console.log('Transfer transaction hash:', hash);
        // Wait for transaction confirmation
        const publicClient = getPublicClient();
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('receipt', receipt);
        if (receipt.status === 'success') {
          console.log('Transfer successful for fid:', fid);
          // Update the transfer status in the database
          await supabaseService
            .from('scores')
            .update({ status: 'complete' })
            .eq('fid', transfer.fid)
            .eq('coin_id', transfer.coin_id)
            .eq('status', 'pending');
          const notifications = await supabaseService.getNotificationByFid(fid);

          const notification = notifications[0];

          const response = await fetch(notification.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              notificationId: crypto.randomUUID(),
              title: `Check your wallet`,
              body: `You earned ${tokenCount * 10 ** 18} ${coin.symbol} tokens`,
              targetUrl: `https://app.minigames.studio/coins/${coin.id}`,
              tokens: [notification.token],
            } satisfies SendNotificationRequest),
          });

          const responseJson = await response.json();

          console.log('response', responseJson);
        } else {
          console.error('Transfer failed for fid:', fid);
        }
      } catch (transferError) {
        console.error('Error transferring tokens for fid:', fid, transferError);
        continue;
      }
    }

    return NextResponse.json({ success: true, data: pendingTransfers });
  } catch (error) {
    console.error('Error processing background task:', error);
    console.log('request', request);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to process task',
      },
      { status: 500 }
    );
  }
}
