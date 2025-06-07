import { init } from '@sentry/nextjs';

init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of the transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    // Additional integrations can be added here
  ],

  // Set up error filtering
  beforeSend(event, hint) {
    // Filter out errors in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Sentry] Error captured:', event);
    }

    // Filter out common false positives
    if (event.exception) {
      const error = hint.originalException;

      // Skip ResizeObserver loop limit exceeded
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);
        if (message.includes('ResizeObserver loop limit exceeded')) {
          return null;
        }

        // Skip network errors that are user-related
        if (
          message.includes('Failed to fetch') ||
          message.includes('NetworkError')
        ) {
          // Still capture but with lower priority
          event.level = 'warning';
        }
      }
    }

    return event;
  },

  // Set context tags
  initialScope: {
    tags: {
      component: 'mini-games-app',
    },
  },
});
