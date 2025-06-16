/**
 * Application configuration constants
 */

/**
 * Token multiplier for converting game scores to token amounts
 * Can be configured via NEXT_PUBLIC_TOKEN_MULTIPLIER environment variable
 * Defaults to 1000 if not set
 */
export const TOKEN_MULTIPLIER = parseInt(
  process.env.NEXT_PUBLIC_TOKEN_MULTIPLIER ?? '1000',
  10
);

/**
 * Premium access threshold - number of tokens required for unlimited play
 * Can be configured via NEXT_PUBLIC_PREMIUM_THRESHOLD environment variable
 * Defaults to 1000000 if not set
 *
 * Note: The 0.01 ETH minimum buy amount should be sufficient to purchase
 * enough tokens to exceed this threshold for premium access
 */
export const PREMIUM_THRESHOLD = parseInt(
  process.env.NEXT_PUBLIC_PREMIUM_THRESHOLD ?? '1000000',
  10
);

/**
 * Free play interval in seconds. Players can play for free once within this
 * period. Defaults to 86400 seconds (24 hours)
 */
export const FREE_PLAY_INTERVAL = parseInt(
  process.env.NEXT_PUBLIC_FREE_PLAY_INTERVAL ?? '86400',
  10
);

/**
 * Validate that the token multiplier is a positive number
 */
if (isNaN(TOKEN_MULTIPLIER) || TOKEN_MULTIPLIER <= 0) {
  throw new Error(
    'TOKEN_MULTIPLIER must be a positive number. Check NEXT_PUBLIC_TOKEN_MULTIPLIER environment variable.'
  );
}

/**
 * Validate that the premium threshold is a positive number
 */
if (isNaN(PREMIUM_THRESHOLD) || PREMIUM_THRESHOLD <= 0) {
  throw new Error(
    'PREMIUM_THRESHOLD must be a positive number. Check NEXT_PUBLIC_PREMIUM_THRESHOLD environment variable.'
  );
}

/**
 * Validate that the free play interval is a positive number
 */
if (isNaN(FREE_PLAY_INTERVAL) || FREE_PLAY_INTERVAL <= 0) {
  throw new Error(
    'FREE_PLAY_INTERVAL must be a positive number. Check NEXT_PUBLIC_FREE_PLAY_INTERVAL environment variable.'
  );
}
