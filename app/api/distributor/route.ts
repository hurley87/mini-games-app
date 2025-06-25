import {
  createClientForWallet,
  getPublicClient,
  getWalletAccount,
} from '@/lib/clients';
import { supabaseService } from '@/lib/supabase';
import { SendNotificationRequest } from '@farcaster/frame-node';
import { NextResponse } from 'next/server';
import { TOKEN_MULTIPLIER } from '@/lib/config';

// Route configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Shared logic for processing transfers
async function processTransfers() {
  try {
    const pendingTransfers =
      await supabaseService.getPendingScoresGroupedByToken();

    for (const transfer of pendingTransfers) {
      const { data: coin, error: coinError } = await supabaseService
        .from('coins')
        .select('*')
        .eq('id', transfer.coin_id)
        .single();

      const fid = transfer.fid;
      if (process.env.NODE_ENV !== 'production') {
        console.log('fid', fid);
      }

      const tokenCount = Math.min(transfer.total_score, 25);
      if (process.env.NODE_ENV !== 'production') {
        console.log('tokenCount', tokenCount);
      }

      if (coinError) {
        console.error('Error getting coin:', coinError);
        continue;
      }

      const coinAddress = coin.coin_address;

      if (process.env.NODE_ENV !== 'production') {
        console.log('coinAddress', coinAddress);
      }

      const account = await getWalletAccount(
        'q6pjcc0zexrczw37fm88rc3j',
        '0xe67C7640c647Ee0Bb85a70f08EDBC385FBeCae3F'
      );

      const walletClient = createClientForWallet(account);

      const player = await supabaseService.getPlayerByFid(fid);

      if (!player || player.length === 0) {
        console.error('Player not found for fid:', fid);
        continue;
      }

      const playerWalletAddress = player?.[0]?.wallet_address;

      if (!playerWalletAddress) {
        console.error('Player wallet address not found for fid:', fid);
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
            BigInt(tokenCount * TOKEN_MULTIPLIER) * BigInt(10 ** 18),
          ],
          account: account,
          chain: walletClient.chain,
        });
        if (process.env.NODE_ENV !== 'production') {
          console.log('Transfer transaction hash:', hash);
        }
        // Wait for transaction confirmation
        const publicClient = getPublicClient();
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (process.env.NODE_ENV !== 'production') {
          console.log('receipt', receipt);
        }
        if (receipt.status === 'success') {
          if (process.env.NODE_ENV !== 'production') {
            console.log('Transfer successful for fid:', fid);
          }
          // Update the transfer status in the database
          await supabaseService
            .from('scores')
            .update({ status: 'complete' })
            .eq('fid', transfer.fid)
            .eq('coin_id', transfer.coin_id)
            .eq('status', 'pending');
          const notifications = await supabaseService.getNotificationByFid(fid);

          if (notifications && notifications.length > 0) {
            const notification = notifications[0];

            if (notification.url && notification.token) {
              try {
                const response = await fetch(notification.url, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    notificationId: crypto.randomUUID(),
                    title: `You earned ${(tokenCount * TOKEN_MULTIPLIER).toLocaleString()} ${coin.symbol} tokens`,
                    body: `Check your wallet: ${formatAddress(playerWalletAddress)}`,
                    targetUrl: `https://app.minigames.studio/coins/${coin.id}`,
                    tokens: [notification.token],
                  } satisfies SendNotificationRequest),
                });

                const responseJson = await response.json();

                if (process.env.NODE_ENV !== 'production') {
                  console.log('Notification sent successfully:', responseJson);
                }
              } catch (notificationError) {
                console.error(
                  'Error sending notification for fid:',
                  fid,
                  notificationError
                );
                // Don't stop processing other transfers if notification fails
              }
            } else {
              if (process.env.NODE_ENV !== 'production') {
                console.log('Notification data incomplete for fid:', fid);
              }
            }
          } else {
            if (process.env.NODE_ENV !== 'production') {
              console.log('No notification settings found for fid:', fid);
            }
          }
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

export async function GET() {
  return await processTransfers();
}

// Handle POST requests (for manual triggers)
export async function POST() {
  return await processTransfers();
}
