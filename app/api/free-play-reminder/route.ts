import {
  supabaseService,
  type Notification,
  type GamePlay,
} from '@/lib/supabase';
import { SendNotificationRequest } from '@farcaster/frame-node';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

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
        const gamePlayRecordKey = `${player.fid}-${coin.id}`;
        const gamePlayRecord = gamePlayRecordsByKey.get(gamePlayRecordKey);

        // If player never played this game, they can get a reminder
        if (!gamePlayRecord) {
          remindersToSend.push({ notification, gameName: coin.name });
          continue;
        }

        // Check if created_at exists and is valid before comparing times
        if (!gamePlayRecord.created_at) {
          // If no timestamp, treat as eligible for reminder (could be old record)
          remindersToSend.push({ notification, gameName: coin.name });
          continue;
        }

        // Check if 24 hours have passed since last play of this specific game
        const lastPlayTime = new Date(gamePlayRecord.created_at).getTime();
        if (now - lastPlayTime >= dayMs) {
          remindersToSend.push({ notification, gameName: coin.name });
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
