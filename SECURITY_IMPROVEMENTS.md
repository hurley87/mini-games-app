# Security Improvements for Mini Games

This document outlines the security measures implemented to prevent fake requests and protect the backend from abuse.

## Overview

The following security measures have been implemented:

1. **FID Verification** - Verify that FIDs exist on Farcaster before processing requests
2. **Daily Points Limits** - Limit the number of points users can earn per day
3. **Rate Limiting** - Prevent excessive API requests
4. **Authentication** - Require authenticated requests (ready for SDK v0.0.61+)
5. **Game Play Validation** - Verify users have actually played games before awarding points

## Implementation Details

### 1. FID Verification (`lib/security.ts`)

Before processing any request, we verify that the FID exists on Farcaster using the Neynar API:

```typescript
const fidExists = await SecurityService.verifyFidExists(fid);
if (!fidExists) {
  return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
}
```

### 2. Daily Points Limits (`lib/rate-limit.ts`)

Users are limited to 10,000 points per day across all games:

```typescript
const dailyLimitResult = await RateLimiter.checkDailyPointsLimit(
  fid,
  score,
  10000 // Daily limit
);
```

Points are tracked in Redis with automatic expiration after 24 hours.

### 3. Rate Limiting

Each endpoint has specific rate limits:

- `/api/award`: 60 requests per hour
- `/api/players`: 10 requests per hour (player creation should be rare)
- `/api/record-play`: 100 requests per hour
- `/api/share-rank`: 10 shares per hour
- `/api/referral`: 1 referral per player (permanent)

### 4. Authentication (`lib/auth.ts`)

The system is ready for Farcaster SDK Quick Auth (v0.0.61+):

```typescript
// When SDK is upgraded, authentication will be enforced:
const authenticatedFid = await FarcasterAuth.requireAuth(request);
```

Currently, authentication is optional but all infrastructure is in place.

### 5. Game Play Validation

Before awarding points, we verify that:

- The game/coin exists
- The player has actually played the game
- The score is within valid ranges for that game

## Protected Endpoints

### `/api/award`

- ✅ FID verification
- ✅ Daily points limit (10,000/day)
- ✅ Rate limiting (60/hour)
- ✅ Score validation
- ✅ Game play verification
- 🔄 Authentication (ready for SDK upgrade)

### `/api/players`

- ✅ FID verification
- ✅ Rate limiting (10/hour)
- 🔄 Authentication (ready for SDK upgrade)

### `/api/record-play`

- ✅ FID verification
- ✅ Rate limiting (100/hour)
- 🔄 Authentication (ready for SDK upgrade)

### `/api/share-rank`

- ✅ FID verification
- ✅ Daily points limit
- ✅ Rate limiting (10/hour)
- 🔄 Authentication (ready for SDK upgrade)

### `/api/referral`

- ✅ FID verification (both sharer and player)
- ✅ Daily points limit for sharer
- ✅ One-time referral per player
- ✅ Self-referral prevention
- 🔄 Authentication (ready for SDK upgrade)

## Client-Side Security

The game embed (`/api/embed/[id]`) now includes:

- Authentication token retrieval (when SDK supports it)
- Automatic game play recording before points are awarded
- User-friendly error messages for rate limits

## Environment Variables Required

```env
# For FID verification
NEYNAR_API_KEY=your_neynar_api_key

# For rate limiting
REDIS_URL=your_redis_url
REDIS_TOKEN=your_redis_token

# For authentication (when enabled)
NEXT_PUBLIC_URL=https://your-domain.com
```

## Upgrading to Full Authentication

When upgrading to `@farcaster/frame-sdk` v0.0.61+:

1. Update package.json:

```json
"@farcaster/frame-sdk": "^0.0.61"
```

2. Remove the "optional" authentication logic in all endpoints
3. Update client-side code to use `sdk.quickAuth.getToken()`

## Monitoring

All security violations are logged:

- Invalid FIDs
- Rate limit violations
- Authentication failures
- Score validation failures

These can be monitored through your logging system to detect attack patterns.

## Future Improvements

1. **IP-based rate limiting** - Add additional layer of rate limiting by IP
2. **Anomaly detection** - Flag unusual scoring patterns
3. **Webhook validation** - Validate webhook signatures
4. **CAPTCHA** - Add CAPTCHA for suspicious activity
5. **Blacklisting** - Ability to blacklist abusive FIDs
