import { useConnect } from 'wagmi';
import { useCallback } from 'react';

/**
 * Safe wrapper around wagmi's useConnect hook to prevent destructuring errors
 * and provide better error handling for undefined returns
 */
export function useSafeConnect(options?: Parameters<typeof useConnect>[0]) {
  const result = useConnect(options);

  // Check if useConnect returned undefined and report to Sentry
  if (!result) {
    console.error(
      'useConnect returned undefined - this indicates a Wagmi provider issue'
    );

    // Lazy load Sentry to avoid circular dependencies
    import('@/lib/sentry')
      .then(({ sentryTracker }) => {
        sentryTracker.componentError(
          new Error('useConnect returned undefined'),
          {
            component_name: 'useSafeConnect',
            props: { options },
          }
        );
      })
      .catch((err) => {
        console.warn('Failed to load Sentry for error reporting:', err);
      });
  }

  // Provide safe defaults if useConnect returns undefined
  const safeResult = {
    connect:
      result?.connect ||
      (() => {
        console.warn('Connect function not available');
      }),
    connectors: result?.connectors || [],
    isPending: result?.isPending || false,
    error: result?.error || null,
    data: result?.data || null,
    variables: result?.variables || null,
    reset: result?.reset || (() => {}),
    status: result?.status || 'idle',
  };

  const safeConnect = useCallback(
    (params: Parameters<typeof safeResult.connect>[0]) => {
      if (safeResult.connect && safeResult.connectors.length > 0) {
        return safeResult.connect(params);
      } else {
        const error = new Error('Wallet connection not available');
        console.warn('Connect function or connectors not available');

        // Report to Sentry
        import('@/lib/sentry')
          .then(({ sentryTracker }) => {
            sentryTracker.userActionError(error, {
              action: 'wallet_connect',
              element: 'connect_button',
              page: 'unknown',
            });
          })
          .catch((err) => {
            console.warn('Failed to load Sentry for error reporting:', err);
          });

        throw error;
      }
    },
    [safeResult.connect, safeResult.connectors]
  );

  return {
    ...safeResult,
    connect: safeConnect,
  };
}
