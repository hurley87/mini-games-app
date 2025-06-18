import {
  supabaseService,
  type Notification,
  type GamePlay,
} from '@/lib/supabase';
import { SendNotificationRequest } from '@farcaster/frame-node';
import { NextResponse } from 'next/server';
import { Address, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { PREMIUM_THRESHOLD } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

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

const decimalsCache = new Map<string, number>();

async function isBelowPremiumThreshold(
  coinAddress: string,
  walletAddress?: string | null
): Promise<boolean> {
  if (!walletAddress) return true;
  try {
    let decimals = decimalsCache.get(coinAddress);
    if (decimals === undefined) {
      const fetched = await publicClient.readContract({
        address: coinAddress as Address,
        abi: ERC20_ABI,
        functionName: 'decimals',
      });
      decimals = Number(fetched);
      decimalsCache.set(coinAddress, decimals);
    }

    const balance = await publicClient.readContract({
      address: coinAddress as Address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress as Address],
    });

    const powerOfTenBigInt = (exp: number): bigint => {
      let result = BigInt(1);
      for (let i = 0; i < exp; i++) {
        result *= BigInt(10);
      }
      return result;
    };

    const minimumTokens =
      BigInt(PREMIUM_THRESHOLD) * powerOfTenBigInt(decimals);
    return (balance as bigint) < minimumTokens;
  } catch (err) {
    console.error(
      `Balance check failed for wallet ${walletAddress} and coin ${coinAddress}:`,
      err
    );
    return true; // default to sending reminder on error
  }
}

async function processReminders() {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Fetch all data in parallel to avoid N+1 queries
  const [players, coins, allNotifications, allGamePlayRecords] =
    await Promise.all([
      supabaseService.getPlayers(),
      supabaseService.getCoins(),
      supabaseService.getAllNotifications(),
      supabaseService.getAllGamePlayRecords(),
    ]);

  // Create lookup maps for O(1) access
  const notificationsByFid = new Map<number, Notification[]>();
  allNotifications.forEach((notification: Notification) => {
    if (!notificationsByFid.has(notification.fid)) {
      notificationsByFid.set(notification.fid, []);
    }
    notificationsByFid.get(notification.fid)!.push(notification);
  });

  const gamePlayRecordsByKey = new Map<string, GamePlay>();
  allGamePlayRecords.forEach((record: GamePlay) => {
    const key = `${record.fid}-${record.game_id}`;
    gamePlayRecordsByKey.set(key, record);
  });

  // Collect all reminders to send
  const remindersToSend = [];

  for (const player of players) {
    // Get notifications for this player
    const notifications = notificationsByFid.get(player.fid);
    if (!notifications || notifications.length === 0) continue;

    const notification = notifications[0];
    if (!notification.url || !notification.token) continue;

    // Check each game/coin for this player
    for (const coin of coins) {
      try {
        // Get the specific game play record using the lookup map
        const gamePlayRecordKey = `${player.fid}-${coin.build_id}`;
        const gamePlayRecord = gamePlayRecordsByKey.get(gamePlayRecordKey);

        // If player never played this game, they can get a reminder
        if (!gamePlayRecord) {
          if (
            await isBelowPremiumThreshold(
              coin.coinAddress,
              player.wallet_address
            )
          ) {
            remindersToSend.push({ notification, gameName: coin.name });
          }
          continue;
        }

        // Check if created_at exists and is valid before comparing times
        if (!gamePlayRecord.created_at) {
          // If no timestamp, treat as eligible for reminder (could be old record)
          if (
            await isBelowPremiumThreshold(
              coin.coinAddress,
              player.wallet_address
            )
          ) {
            remindersToSend.push({ notification, gameName: coin.name });
          }
          continue;
        }

        // Check if 24 hours have passed since last play of this specific game
        const lastPlayTime = new Date(gamePlayRecord.created_at).getTime();
        if (now - lastPlayTime >= dayMs) {
          if (
            await isBelowPremiumThreshold(
              coin.coinAddress,
              player.wallet_address
            )
          ) {
            remindersToSend.push({ notification, gameName: coin.name });
          }
        }
      } catch (err) {
        console.error(
          `Failed to process reminder for player ${player.fid} and coin ${coin.id}:`,
          err
        );
        // Continue with next coin instead of breaking the entire loop
      }
    }
  }

  // Send all reminders in parallel using Promise.allSettled
  const reminderResults = await Promise.allSettled(
    remindersToSend.map(({ notification, gameName }) =>
      sendReminder(notification, gameName)
    )
  );

  // Log any failed reminders
  const failedReminders = reminderResults.filter(
    (result) => result.status === 'rejected'
  );
  if (failedReminders.length > 0) {
    console.error(
      `Failed to send ${failedReminders.length} reminders:`,
      failedReminders
    );
  }

  return NextResponse.json({
    success: true,
    totalReminders: remindersToSend.length,
    successfulReminders: reminderResults.filter((r) => r.status === 'fulfilled')
      .length,
    failedReminders: failedReminders.length,
  });
}

async function sendReminder(notification: Notification, gameName: string) {
  if (!notification.url || !notification.token) {
    throw new Error('Notification missing url or token');
  }

  try {
    await fetch(notification.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: crypto.randomUUID(),
        title: 'Daily free play available!',
        body: `Your free ${gameName} round has refreshed.`,
        targetUrl: 'https://app.minigames.studio',
        tokens: [notification.token],
      } satisfies SendNotificationRequest),
    });
  } catch (err) {
    console.error('Failed to send reminder:', err);
    throw err; // Re-throw to be caught by caller
  }
}

export async function GET() {
  return processReminders();
}

export async function POST() {
  return processReminders();
}
