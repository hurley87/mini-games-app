'use client';

import * as Sentry from '@sentry/nextjs';
import { trackGameEvent } from './posthog';

// Initialize Sentry with user context
export const initializeSentry = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log('[Sentry] Initialized successfully');
  }
};

// Set user context for error tracking
export const setSentryUser = (user: {
  id: string;
  username?: string;
  email?: string;
  fid?: number;
  wallet_address?: string;
}) => {
  Sentry.setUser({
    id: user.id,
    username: user.username,
    email: user.email,
    fid: user.fid?.toString(),
    wallet_address: user.wallet_address,
  });
};

// Set additional context
export const setSentryContext = (context: Record<string, unknown>) => {
  Sentry.setContext('additional_info', context);
};

// Set tags for filtering
export const setSentryTags = (tags: Record<string, string>) => {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
};

// Error reporting functions
export const reportError = (
  error: Error | string,
  context?: {
    level?: 'error' | 'warning' | 'info';
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: Record<string, unknown>;
  }
) => {
  // Set temporary context
  if (context?.tags) {
    setSentryTags(context.tags);
  }

  if (context?.extra) {
    Sentry.setContext('error_context', context.extra);
  }

  if (context?.user) {
    Sentry.setUser(context.user);
  }

  // Report to Sentry
  if (typeof error === 'string') {
    Sentry.captureMessage(error, context?.level || 'error');
  } else {
    Sentry.captureException(error);
  }

  // Also track in PostHog for analytics
  const errorMessage = typeof error === 'string' ? error : error.message;
  trackGameEvent.error('sentry_error', errorMessage, {
    error_type: typeof error === 'string' ? 'message' : error.name,
    level: context?.level || 'error',
    ...context?.extra,
  });
};

// Specific error types for the Mini Games app
export const sentryTracker = {
  // Authentication errors
  authError: (
    error: Error | string,
    context?: { fid?: number; username?: string }
  ) => {
    reportError(error, {
      level: 'error',
      tags: { error_category: 'authentication' },
      extra: {
        fid: context?.fid,
        username: context?.username,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Game-related errors
  gameError: (
    error: Error | string,
    context?: {
      game_id?: string;
      game_name?: string;
      coin_address?: string;
      action?: string;
    }
  ) => {
    reportError(error, {
      level: 'error',
      tags: {
        error_category: 'game',
        game_id: context?.game_id || 'unknown',
        action: context?.action || 'unknown',
      },
      extra: {
        game_name: context?.game_name,
        coin_address: context?.coin_address,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // API errors
  apiError: (
    error: Error | string,
    context?: {
      endpoint?: string;
      method?: string;
      status_code?: number;
      response_data?: unknown;
    }
  ) => {
    reportError(error, {
      level: 'error',
      tags: {
        error_category: 'api',
        endpoint: context?.endpoint || 'unknown',
        method: context?.method || 'unknown',
      },
      extra: {
        status_code: context?.status_code,
        response_data: context?.response_data,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Network/fetch errors
  networkError: (
    error: Error | string,
    context?: {
      url?: string;
      method?: string;
      timeout?: boolean;
    }
  ) => {
    reportError(error, {
      level: 'warning',
      tags: {
        error_category: 'network',
        network_issue: context?.timeout ? 'timeout' : 'connection',
      },
      extra: {
        url: context?.url,
        method: context?.method,
        timeout: context?.timeout,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Blockchain/Web3 errors
  web3Error: (
    error: Error | string,
    context?: {
      action?: string;
      coin_address?: string;
      wallet_address?: string;
      transaction_hash?: string;
    }
  ) => {
    reportError(error, {
      level: 'error',
      tags: {
        error_category: 'web3',
        action: context?.action || 'unknown',
      },
      extra: {
        coin_address: context?.coin_address,
        wallet_address: context?.wallet_address,
        transaction_hash: context?.transaction_hash,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Component errors (for error boundaries)
  componentError: (
    error: Error,
    context?: {
      component_name?: string;
      component_stack?: string;
      props?: Record<string, unknown>;
    }
  ) => {
    reportError(error, {
      level: 'error',
      tags: {
        error_category: 'component',
        component: context?.component_name || 'unknown',
      },
      extra: {
        component_stack: context?.component_stack,
        props: context?.props,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Performance issues
  performanceIssue: (
    message: string,
    context?: {
      metric_name?: string;
      value?: number;
      threshold?: number;
      page?: string;
    }
  ) => {
    reportError(message, {
      level: 'warning',
      tags: {
        error_category: 'performance',
        metric: context?.metric_name || 'unknown',
      },
      extra: {
        value: context?.value,
        threshold: context?.threshold,
        page: context?.page,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // User action errors
  userActionError: (
    error: Error | string,
    context?: {
      action?: string;
      element?: string;
      page?: string;
      user_id?: string;
    }
  ) => {
    reportError(error, {
      level: 'info',
      tags: {
        error_category: 'user_action',
        action: context?.action || 'unknown',
      },
      extra: {
        element: context?.element,
        page: context?.page,
        user_id: context?.user_id,
        timestamp: new Date().toISOString(),
      },
    });
  },
};

// Enhanced fetch wrapper with Sentry tracking
export const sentryFetch = async (
  url: string,
  options?: RequestInit & { timeout?: number }
) => {
  const { timeout = 30000, ...fetchOptions } = options || {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      sentryTracker.apiError(
        `HTTP ${response.status}: ${response.statusText}`,
        {
          endpoint: url,
          method: fetchOptions.method || 'GET',
          status_code: response.status,
        }
      );
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        sentryTracker.networkError('Request timeout', {
          url,
          method: fetchOptions.method || 'GET',
          timeout: true,
        });
      } else {
        sentryTracker.networkError(error, {
          url,
          method: fetchOptions.method || 'GET',
          timeout: false,
        });
      }
    }

    throw error;
  }
};

// Transaction wrapper for performance monitoring
export const withSentryTransaction = async <T>(
  name: string,
  operation: string,
  callback: () => Promise<T>
): Promise<T> => {
  return await Sentry.startSpan(
    {
      name,
      op: operation,
    },
    callback
  );
};

export default Sentry;
