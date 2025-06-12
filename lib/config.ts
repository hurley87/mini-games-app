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
