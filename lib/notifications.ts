import { supabaseService } from './supabase';
import {
  SendNotificationRequest,
  sendNotificationResponseSchema,
} from '@farcaster/frame-sdk';

const targetUrl = 'https://app.minigames.studio';

// Rate limit configuration
const RATE_LIMIT_DELAY = 1000; // Base delay in ms
const MAX_RETRIES = 3; // Maximum number of retries
const BATCH_SIZE = 10; // Reduced batch size to avoid rate limits

export interface Notification {
  fid: number;
  url: string;
  token: string;
}

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to calculate exponential backoff delay
const getBackoffDelay = (retryCount: number) => {
  return Math.min(RATE_LIMIT_DELAY * Math.pow(2, retryCount), 30000); // Max 30s delay
};

type SendFrameNotificationResult =
  | {
      state: 'error';
      error: unknown;
    }
  | { state: 'no_token' }
  | { state: 'rate_limit' }
  | { state: 'success' };

/**
 * Sends a notification to a single user with retry logic
 * @param notification - The notification to send
 * @param title - The notification title
 * @param body - The notification body text
 * @param retryCount - Current retry attempt
 * @returns Result of the notification attempt
 */
export async function sendFrameNotification({
  notification,
  title,
  body,
  gameId,
  retryCount = 0,
}: {
  notification: Notification;
  title: string;
  body: string;
  gameId: string;
  retryCount?: number;
}): Promise<SendFrameNotificationResult> {
  if (!notification.url) {
    return { state: 'no_token' };
  }

  try {
    const response = await fetch(notification.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationId: crypto.randomUUID(),
        title,
        body,
        targetUrl: `${targetUrl}/info/${gameId}`,
        tokens: [notification.token],
      } satisfies SendNotificationRequest),
    });

    const responseJson = await response.json();

    if (response.status === 200) {
      const responseBody =
        sendNotificationResponseSchema.safeParse(responseJson);
      if (responseBody.success === false) {
        return { state: 'error', error: responseBody.error.errors };
      }

      if (responseBody.data.result.rateLimitedTokens.length) {
        if (retryCount < MAX_RETRIES) {
          const backoffDelay = getBackoffDelay(retryCount);
          console.log(
            `Rate limited, retrying in ${backoffDelay}ms (attempt ${
              retryCount + 1
            }/${MAX_RETRIES})`
          );
          await delay(backoffDelay);
          return sendFrameNotification({
            notification,
            title,
            body,
            gameId,
            retryCount: retryCount + 1,
          });
        }
        return { state: 'rate_limit' };
      }

      return { state: 'success' };
    } else {
      return { state: 'error', error: responseJson };
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return { state: 'error', error };
  }
}

/**
 * Sends the same notification to a batch of users with improved rate limit handling
 * @param notifications - Array of notifications to notify
 * @param title - The notification title
 * @param body - The notification body text
 * @returns Summary of notification results
 */
export async function sendBatchNotifications(
  notifications: Notification[],
  title: string,
  body: string,
  gameId: string
) {
  let successful = 0;
  let failed = 0;
  let rateLimited = 0;
  let noToken = 0;

  // Process in smaller batches to avoid overwhelming the API
  for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
    const batch = notifications.slice(i, i + BATCH_SIZE);

    // Process batch sequentially to better handle rate limits
    for (const notification of batch) {
      const result = await sendFrameNotification({
        notification,
        title,
        body,
        gameId,
      });

      switch (result.state) {
        case 'success':
          successful++;
          break;
        case 'rate_limit':
          rateLimited++;
          break;
        case 'no_token':
          noToken++;
          break;
        case 'error':
          console.error(
            `Error sending notification to FID ${notification.fid}:`,
            result.error
          );
          failed++;
          break;
      }

      // Add a small delay between notifications to avoid rate limits
      await delay(100);
    }
  }

  return {
    successful,
    failed,
    rateLimited,
    noToken,
    total: notifications.length,
  };
}

/**
 * Fetches all user IDs from the database
 * @returns Array of user FIDs
 */
export async function getAllNotifications(): Promise<Notification[]> {
  const { data, error } = await supabaseService
    .from('notifications')
    .select('*');

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return data || [];
}

/**
 * Sends a notification to all users in the system
 * @param title - The notification title
 * @param body - The notification body text
 * @returns Summary of notification results
 */
export async function notifyAllUsers(
  title: string,
  body: string,
  gameId: string
) {
  const notifications = await getAllNotifications();

  if (notifications.length === 0) {
    return {
      successful: 0,
      failed: 0,
      rateLimited: 0,
      noToken: 0,
      total: 0,
      message: 'No notifications found to notify',
    };
  }

  const result = await sendBatchNotifications(
    notifications,
    title,
    body,
    gameId
  );

  return {
    ...result,
    message: `Sent notifications to ${result.successful} of ${result.total} notifications (${result.failed} failed, ${result.rateLimited} rate limited, ${result.noToken} without tokens)`,
  };
}
