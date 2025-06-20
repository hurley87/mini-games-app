import { NextResponse } from 'next/server';
import {
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
  ParseWebhookEventResult,
} from '@farcaster/frame-node';
import { supabaseService } from '@/lib/supabase';

function isFrameEvent(
  data: ParseWebhookEventResult
): data is ParseWebhookEventResult & { event: string } {
  return 'event' in data;
}

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await parseWebhookEvent(body, verifyAppKeyWithNeynar);
    const event = data.event.event;

    if (!isFrameEvent(data)) {
      throw new Error('Invalid event data');
    }

    // Handle different event types
    switch (event) {
      case 'frame_added':
        if ('notificationDetails' in data.event) {
          const fid = data.fid;
          const url = data.event.notificationDetails?.url;
          const token = data.event.notificationDetails?.token;
          const notification = {
            fid,
            url,
            token,
          };

          try {
            await supabaseService.insertNotification(notification);
          } catch (error) {
            console.error('Failed to store notification:', error);
            return NextResponse.json(
              { error: 'Failed to store notification' },
              { status: 500 }
            );
          }
        }
        break;
      case 'frame_removed':
        if (process.env.NODE_ENV !== 'production') {
          console.log('Frame removed');
        }
        break;
      case 'notifications_enabled':
        if ('notificationDetails' in data) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('Notifications enabled:', data.notificationDetails);
          }
        }
        break;
      case 'notifications_disabled':
        if (process.env.NODE_ENV !== 'production') {
          console.log('Notifications disabled');
        }
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Invalid webhook event' },
      { status: 400 }
    );
  }
}
