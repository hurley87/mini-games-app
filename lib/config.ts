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
 * Validate that the token multiplier is a positive number
 */
if (isNaN(TOKEN_MULTIPLIER) || TOKEN_MULTIPLIER <= 0) {
  throw new Error(
    'TOKEN_MULTIPLIER must be a positive number. Check NEXT_PUBLIC_TOKEN_MULTIPLIER environment variable.'
  );
}
