import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
