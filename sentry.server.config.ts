import { init } from '@sentry/nextjs';

init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of the transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Set up error filtering for server
  beforeSend(event, hint) {
    // Filter out errors in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Sentry Server] Error captured:', event);
    }

    // Filter out common server false positives
    if (event.exception) {
      const error = hint.originalException;

      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);

        // Skip certain API errors that are expected
        if (message.includes('ECONNRESET') || message.includes('EPIPE')) {
          event.level = 'warning';
        }
      }
    }

    return event;
  },

  // Set context tags
  initialScope: {
    tags: {
      component: 'mini-games-server',
    },
  },
});
