import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { sdk } from '@farcaster/frame-sdk';
import { sentryTracker } from './sentry';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a timestamp into a relative time string (e.g., "2m", "1h", "3d")
 * @param timestamp - ISO timestamp string
 * @returns Formatted time string
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const created = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y`;
}

/**
 * Format a future timestamp into a relative time string from now
 * @param timestamp ISO timestamp string in the future
 */
export function formatTimeUntil(timestamp: string): string {
  const future = new Date(timestamp).getTime();
  const now = Date.now();
  let diff = Math.floor((future - now) / 1000);
  if (diff <= 0) return 'now';
  if (diff < 60) return `${diff}s`;
  diff = Math.floor(diff / 60);
  if (diff < 60) return `${diff}m`;
  diff = Math.floor(diff / 60);
  if (diff < 24) return `${diff}h`;
  diff = Math.floor(diff / 24);
  return `${diff}d`;
}

/**
 * Formats a currency value for display
 * @param value - Currency value as string
 * @returns Formatted currency string
 */
export function formatCurrency(value: string | undefined): string {
  if (!value || value === '0') return 'N/A';

  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';

  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `${(num / 1e3).toFixed(1)}K`;
  } else {
    return `${num.toFixed(2)}`;
  }
}

/**
 * Formats holder count for display
 * @param count - Number of holders
 * @returns Formatted holder count string
 */
export function formatHolders(count: number | undefined): string {
  if (!count) return 'N/A';

  if (count >= 1e6) {
    return `${(count / 1e6).toFixed(1)}M`;
  } else if (count >= 1e3) {
    return `${(count / 1e3).toFixed(1)}K`;
  } else {
    return count.toString();
  }
}

/**
 * Formats large numbers with abbreviations (K, M, B, T)
 * @param num - Number to format
 * @param decimals - Number of decimal places to show (default 0)
 * @returns Formatted number string
 */
export function formatNumber(
  num: number | undefined,
  decimals: number = 0
): string {
  if (!num || num === 0) return '0';

  if (num >= 1e12) {
    return `${(num / 1e12).toFixed(decimals)}T`;
  } else if (num >= 1e9) {
    return `${(num / 1e9).toFixed(decimals)}B`;
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(decimals)}M`;
  } else if (num >= 1e3) {
    return `${(num / 1e3).toFixed(decimals)}K`;
  } else {
    return num.toString();
  }
}

/**
 * Formats token balance from wei to readable format
 * @param balance - Token balance as string (in wei)
 * @param decimals - Number of decimal places (default 18)
 * @returns Formatted token balance string
 */
export function formatTokenBalance(
  balance: string | undefined,
  decimals: number = 18
): string {
  if (!balance || balance === '0') return '0';

  try {
    const balanceBigInt = BigInt(balance);
    const divisor = BigInt(10 ** decimals);
    const wholePart = balanceBigInt / divisor;
    const fractionalPart = balanceBigInt % divisor;

    // Convert to number for easier formatting
    const wholeNumber = Number(wholePart);
    const fractionalNumber = Number(fractionalPart) / Number(divisor);
    const totalNumber = wholeNumber + fractionalNumber;

    if (totalNumber >= 1e9) {
      return `${(totalNumber / 1e9).toFixed(2)}B`;
    } else if (totalNumber >= 1e6) {
      return `${(totalNumber / 1e6).toFixed(2)}M`;
    } else if (totalNumber >= 1e3) {
      return `${(totalNumber / 1e3).toFixed(1)}K`;
    } else if (totalNumber >= 1) {
      return totalNumber.toFixed(2);
    } else if (totalNumber > 0) {
      // For very small numbers, show more decimal places
      return totalNumber.toFixed(6).replace(/\.?0+$/, '');
    } else {
      return '0';
    }
  } catch (error) {
    console.error('Error formatting token balance:', error);
    return '0';
  }
}

/**
 * Handles viewing a coin token via Farcaster SDK
 * @param coinAddress - The coin contract address
 * @param context - Additional context for error tracking
 */
export async function handleViewCoin(
  coinAddress: string,
  context?: { element?: string; page?: string }
) {
  try {
    await sdk.actions.viewToken({
      token: `eip155:8453/erc20:${coinAddress}`,
    });
  } catch (error) {
    sentryTracker.userActionError(
      error instanceof Error ? error : new Error('Failed to track view coin'),
      {
        action: 'view_coin',
        element: context?.element || 'coin_card',
        page: context?.page || 'coins_list',
      }
    );
  }
}
