'use client';

import posthog from 'posthog-js';

// Initialize PostHog
export const initPostHog = () => {
  if (typeof window !== 'undefined' && !posthog.__loaded) {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (apiKey) {
      posthog.init(apiKey, {
        api_host: host || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false, // We'll capture pageviews manually
        capture_pageleave: true,
        loaded: (posthogInstance) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('PostHog loaded successfully');
          }
          // Suppress unused variable warning
          void posthogInstance;
        },
      });
    } else {
      console.warn('PostHog API key not found. Analytics will be disabled.');
    }
  }
};

// Event tracking functions
export const trackEvent = (
  eventName: string,
  properties?: Record<string, unknown>
) => {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture(eventName, properties);
  }
};

// Identify user
export const identifyUser = (
  userId: string,
  traits?: Record<string, unknown>
) => {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.identify(userId, traits);
  }
};

// Set user properties
export const setUserProperties = (properties: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.setPersonProperties(properties);
  }
};

// Track page views
export const trackPageView = (
  pageName?: string,
  properties?: Record<string, unknown>
) => {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      page_name: pageName,
      ...properties,
    });
  }
};

// Game-specific tracking functions
export const trackGameEvent = {
  // User authentication/identification
  userLogin: (fid: number, username: string, wallet?: string) => {
    trackEvent('user_login', {
      fid,
      username,
      wallet_address: wallet,
      login_method: 'farcaster',
    });
  },

  // Game browsing
  gamesList: () => {
    trackEvent('games_list_viewed');
  },

  gameCardView: (gameId: string, gameName: string, creator: string) => {
    trackEvent('game_card_viewed', {
      game_id: gameId,
      game_name: gameName,
      creator,
    });
  },

  // Game actions
  gameStart: (gameId: string, gameName: string, coinAddress: string) => {
    trackEvent('game_started', {
      game_id: gameId,
      game_name: gameName,
      coin_address: coinAddress,
    });
  },

  gameExit: (gameId: string, gameName: string, sessionTime: number) => {
    trackEvent('game_exited', {
      game_id: gameId,
      game_name: gameName,
      session_time_seconds: sessionTime,
    });
  },

  gameComplete: (
    gameId: string,
    gameName: string,
    score: number,
    sessionTime: number
  ) => {
    trackEvent('game_completed', {
      game_id: gameId,
      game_name: gameName,
      score,
      session_time_seconds: sessionTime,
    });
  },

  // Coin/Token interactions
  coinAddressCopy: (coinAddress: string, coinName: string) => {
    trackEvent('coin_address_copied', {
      coin_address: coinAddress,
      coin_name: coinName,
    });
  },

  dexScreenerClick: (coinAddress: string, coinName: string) => {
    trackEvent('dex_screener_clicked', {
      coin_address: coinAddress,
      coin_name: coinName,
    });
  },

  // Leaderboard
  leaderboardView: () => {
    trackEvent('leaderboard_viewed');
  },

  // Navigation
  navigationClick: (destination: string, source: string) => {
    trackEvent('navigation_click', {
      destination,
      source,
    });
  },

  // Error tracking - now also integrates with Sentry for critical errors
  error: (
    errorType: string,
    errorMessage: string,
    context?: Record<string, unknown>
  ) => {
    trackEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      ...context,
    });

    // For critical errors, also report to Sentry
    if (
      errorType === 'api_error' ||
      errorType === 'authentication_error' ||
      errorType === 'zora_fetch_error' ||
      errorType === 'fetch_error'
    ) {
      // Lazy load Sentry to avoid circular dependencies
      import('@/lib/sentry')
        .then(({ sentryTracker }) => {
          if (errorType === 'api_error') {
            sentryTracker.apiError(errorMessage, {
              endpoint: context?.endpoint as string,
              method: context?.method as string,
              status_code: context?.status_code as number,
            });
          } else if (errorType === 'authentication_error') {
            sentryTracker.authError(errorMessage, {
              fid: context?.fid as number,
              username: context?.username as string,
            });
          } else if (errorType === 'zora_fetch_error') {
            sentryTracker.web3Error(errorMessage, {
              action: 'fetch_data',
              coin_address: context?.coin_address as string,
            });
          } else {
            sentryTracker.apiError(errorMessage, {
              endpoint: (context?.endpoint as string) || 'unknown',
              method: (context?.method as string) || 'GET',
            });
          }
        })
        .catch((err) => {
          console.warn('Failed to load Sentry for error reporting:', err);
        });
    }
  },
};

export default posthog;
