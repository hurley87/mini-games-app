# Sentry Error Tracking Setup Guide

## Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your_sentry_project_dsn
```

**Note:** You can get your Sentry DSN from your Sentry project settings. It looks like: `https://[key]@[orgid].ingest.sentry.io/[projectid]`

## What's Being Tracked

The following errors and events are now being tracked throughout your Mini Games app:

### Error Categories

#### **Authentication Errors**

- Failed user authentication with Farcaster
- Missing required user data
- Login/logout failures

#### **API Errors**

- Failed API calls to `/api/players`, `/api/coins`, `/api/distributor`
- HTTP errors with status codes
- Network timeouts and connection issues

#### **Game Errors**

- Game start/exit failures
- Game timeout handling errors
- Game session tracking failures

#### **Web3/Blockchain Errors**

- Failed Zora data fetching
- Smart contract interaction errors
- Wallet connection issues

#### **User Action Errors**

- Failed clipboard operations
- Image loading failures
- Navigation tracking errors
- UI interaction failures

#### **Component Errors**

- React component crashes (via Error Boundaries)
- Rendering errors
- Props validation failures

#### **Performance Issues**

- Slow API responses
- Large bundle sizes
- Memory leaks

### Context & Metadata

Each error includes rich context:

- **User Information**: FID, username, wallet address
- **Game Context**: Game ID, name, coin address, creator
- **Technical Details**: Error messages, stack traces, timestamps
- **User Actions**: What the user was trying to do when the error occurred

## Error Severity Levels

- **Error**: Critical issues that break functionality
- **Warning**: Non-critical issues that may affect UX
- **Info**: Informational events for debugging

## Integration with PostHog

Sentry is integrated with PostHog analytics:

- Critical errors are automatically sent to both systems
- PostHog tracks user behavior leading to errors
- Sentry provides detailed error context and debugging info

## Implementation Details

### Files Created/Modified

1. **`sentry.client.config.ts`** - Client-side Sentry configuration
2. **`sentry.server.config.ts`** - Server-side Sentry configuration
3. **`sentry.edge.config.ts`** - Edge runtime Sentry configuration
4. **`lib/sentry.ts`** - Sentry utilities and error tracking functions
5. **`app/components/error-boundary.tsx`** - React error boundary component
6. **`instrumentation.ts`** - Next.js instrumentation hooks
7. **`next.config.mjs`** - Updated with Sentry webpack plugin
8. **All existing components** - Enhanced with Sentry error tracking

### Key Features

- **Automatic Error Capture** - Unhandled errors are automatically captured
- **User Context** - All errors include user identification
- **Performance Monitoring** - Track slow operations and performance issues
- **Error Filtering** - Filter out false positives and development noise
- **Session Replay** - Optional visual replay of user sessions with errors
- **Source Maps** - Proper error stack traces in production
- **Error Boundaries** - Graceful handling of React component crashes

## Error Boundary Usage

Wrap components that might crash:

```tsx
import { ErrorBoundary } from '@/app/components/error-boundary';

<ErrorBoundary name="GamesList">
  <CoinsList />
</ErrorBoundary>;
```

Or use the HOC wrapper:

```tsx
import { withErrorBoundary } from '@/app/components/error-boundary';

export default withErrorBoundary(MyComponent, 'MyComponent');
```

## Manual Error Reporting

Use the Sentry utilities for custom error tracking:

```typescript
import { sentryTracker } from '@/lib/sentry';

// Report different types of errors
sentryTracker.gameError('Failed to load game', {
  game_id: 'game-123',
  game_name: 'My Game',
  coin_address: '0x...',
  action: 'load_game',
});

sentryTracker.apiError('API request failed', {
  endpoint: '/api/games',
  method: 'GET',
  status_code: 500,
});

sentryTracker.userActionError('Button click failed', {
  action: 'play_game',
  element: 'play_button',
  page: 'game_list',
});
```

## Enhanced Fetch with Error Tracking

Use the Sentry-enhanced fetch wrapper:

```typescript
import { sentryFetch } from '@/lib/sentry';

try {
  const response = await sentryFetch('/api/games', {
    method: 'GET',
    timeout: 10000, // 10 second timeout
  });
  const data = await response.json();
} catch (error) {
  // Error is automatically tracked in Sentry
  console.error('Failed to fetch games:', error);
}
```

## Performance Monitoring

Track performance-critical operations:

```typescript
import { withSentryTransaction } from '@/lib/sentry';

const result = await withSentryTransaction(
  'game-load',
  'game.load',
  async () => {
    // Your game loading logic here
    return loadGameData();
  }
);
```

## Viewing Your Data

1. **Log in to your Sentry dashboard**
2. **Issues Tab** - View all captured errors
3. **Performance Tab** - Monitor application performance
4. **Releases Tab** - Track errors by deployment
5. **Alerts** - Set up notifications for critical errors

### Useful Sentry Features

- **Error Grouping** - Similar errors are grouped together
- **Error Trends** - See if errors are increasing over time
- **User Impact** - Understand how many users are affected
- **Error Context** - Full stack traces and user actions
- **Integration** - Connect with Slack, GitHub, etc.

## Error Analysis Workflow

1. **Identify Critical Errors** - Focus on errors affecting many users
2. **Analyze Error Context** - Review user actions and technical details
3. **Reproduce Issues** - Use context to reproduce the error
4. **Fix and Deploy** - Implement fixes and monitor resolution
5. **Monitor Trends** - Track error rates over time

## Privacy Considerations

- **User Data** - Only essential user data is captured (FID, username)
- **Sensitive Data** - Private keys and sensitive information are never captured
- **PII Scrubbing** - Sentry automatically scrubs common PII patterns
- **Data Retention** - Errors are retained according to your Sentry plan
- **GDPR Compliance** - Sentry provides GDPR-compliant data handling

## Best Practices

### Error Reporting

- Report errors with sufficient context for debugging
- Use appropriate severity levels
- Include user actions that led to the error
- Group related errors with consistent messaging

### Performance

- Monitor critical user journeys
- Set up alerts for performance regressions
- Track Core Web Vitals and custom metrics

### Release Management

- Tag releases in Sentry to track which version introduced issues
- Use source maps for readable stack traces
- Monitor error rates after deployments

## Next Steps

1. **Add your Sentry DSN** to `.env.local`
2. **Deploy your app** with Sentry enabled
3. **Generate some errors** to test the integration
4. **Set up alerts** for critical error types
5. **Create dashboards** for monitoring error trends
6. **Configure release tracking** for better error attribution

## Troubleshooting

### Common Issues

**Sentry not capturing errors:**

- Check that NEXT_PUBLIC_SENTRY_DSN is set correctly
- Verify the DSN format and project permissions
- Check browser console for Sentry initialization messages

**Missing source maps:**

- Ensure builds are running with source map generation
- Check Sentry project settings for source map uploads
- Verify auth token for source map uploads

**Too many errors:**

- Adjust sampling rates in sentry.client.config.ts
- Add more filters in beforeSend hooks
- Review and improve error boundaries

Your Mini Games app now has comprehensive error monitoring to help you quickly identify and fix issues affecting your users! 🛡️🔍
