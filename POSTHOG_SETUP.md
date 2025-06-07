# PostHog Analytics Setup Guide

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Note:** You can get your PostHog API key from your PostHog project settings. If you're using PostHog Cloud (US), you can keep the default host. For EU, use `https://eu.i.posthog.com`.

## What's Being Tracked

The following events are now being tracked throughout your Mini Games app:

### User Events

- **user_login**: When a user authenticates with Farcaster
- **authentication_error**: When user authentication fails

### Game Events

- **games_list_viewed**: When the main games page loads
- **game_card_viewed**: When a user views a specific game card
- **game_started**: When a user starts playing a game
- **game_exited**: When a user exits a game (with session time)
- **game_completed**: When a user completes a game (with score and session time)

### Navigation Events

- **navigation_click**: When users navigate between pages
- **leaderboard_viewed**: When the leaderboard page is viewed

### Coin/Token Events

- **coin_address_copied**: When a user copies a coin address
- **dex_screener_clicked**: When a user clicks to view on DEX Screener

### Error Events

- **error_occurred**: When various errors happen (API failures, connection issues, etc.)

## User Identification

Users are automatically identified using their Farcaster ID (FID) with the following properties:

- Username
- Display name
- Profile picture URL
- Wallet address (if connected)

## Page Views

All page views are automatically tracked with:

- Page name
- URL pathname
- Search parameters
- Full URL

## Implementation Details

### Files Modified/Created

1. **`lib/posthog.ts`** - PostHog configuration and tracking utilities
2. **`app/components/posthog-provider.tsx`** - PostHog provider component
3. **`app/providers.tsx`** - Updated to include PostHog provider
4. **`app/page.tsx`** - Added user authentication tracking
5. **`app/components/coins-list.tsx`** - Added game browsing and interaction tracking
6. **`app/components/game-wrapper.tsx`** - Added game session tracking
7. **`app/components/header.tsx`** - Added navigation tracking
8. **`app/components/header-profile.tsx`** - Added profile interaction tracking
9. **`app/leaderboard/page.tsx`** - Added leaderboard view tracking

### Key Features

- **Automatic page view tracking** - Tracks all route changes
- **User identification** - Links events to specific users via Farcaster ID
- **Error tracking** - Captures and reports errors with context
- **Game session tracking** - Measures engagement and play time
- **Safe initialization** - Only loads PostHog when API key is available
- **Development logging** - Shows PostHog status in development mode

## Viewing Your Data

1. Log in to your PostHog dashboard
2. Go to "Events" to see real-time event tracking
3. Use "Insights" to create custom analytics dashboards
4. Set up "Funnels" to track user conversion paths
5. Create "Cohorts" to segment users by behavior

## Next Steps

1. Add your PostHog API key to `.env.local`
2. Deploy your app or test locally
3. Navigate through your app to generate events
4. Check your PostHog dashboard to see the events coming in
5. Create custom dashboards and insights based on your needs

## Custom Event Tracking

If you want to add more custom events, use the tracking utilities:

```typescript
import { trackGameEvent, trackEvent } from '@/lib/posthog';

// Use predefined game events
trackGameEvent.gameStart('game-id', 'Game Name', 'coin-address');

// Or create custom events
trackEvent('custom_event_name', {
  property1: 'value1',
  property2: 'value2',
});
```

## Privacy Considerations

- PostHog is configured with `person_profiles: 'identified_only'` to only create profiles for authenticated users
- Only essential game and navigation data is tracked
- User wallet addresses are only tracked when explicitly connected
- All tracking respects user privacy and follows best practices
