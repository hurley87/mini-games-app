import { supabaseService } from '@/lib/supabase';
import { SendNotificationRequest } from '@farcaster/frame-node';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function processReminders() {
  const players = await supabaseService.getPlayers();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  for (const player of players) {
    const plays = await supabaseService.getPlayerGamePlays(player.fid);
    if (!plays || plays.length === 0) continue;
    const lastPlay = plays.reduce((p, c) =>
      new Date(c.created_at!).getTime() > new Date(p.created_at!).getTime() ? c : p
    );
    if (now - new Date(lastPlay.created_at!).getTime() < dayMs) continue;
    const notifications = await supabaseService.getNotificationByFid(player.fid);
    if (!notifications || notifications.length === 0) continue;
    const notification = notifications[0];
    if (!notification.url || !notification.token) continue;
    try {
      await fetch(notification.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId: crypto.randomUUID(),
          title: 'Daily free play available!',
          body: 'Your free game round has refreshed.',
          targetUrl: 'https://app.minigames.studio',
          tokens: [notification.token],
        } satisfies SendNotificationRequest),
      });
    } catch (err) {
      console.error('Failed to send reminder for fid', player.fid, err);
    }
  }
  return NextResponse.json({ success: true });
}

export async function GET() {
  return processReminders();
}
export async function POST() {
  return processReminders();
}
