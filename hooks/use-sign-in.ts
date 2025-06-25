import { useMiniApp } from '@/contexts/miniapp-context';
import sdk from '@farcaster/frame-sdk';
import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useApiQuery } from '@/hooks/use-api-query';

interface User {
  id: string;
  name: string;
  username: string;
  pfp: string;
  wallet_address: string;
}

export const useSignIn = ({
  autoSignIn = false,
  onSuccess,
}: {
  autoSignIn?: boolean;
  onSuccess?: (user: User) => void;
}) => {
  const { context } = useMiniApp();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { data: user, refetch: refetchUser } = useApiQuery<User>({
    url: '/api/users/me',
    method: 'GET',
    isProtected: true,
    queryKey: ['user'],
    enabled: !!isSignedIn,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();

  const handleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!address) {
        console.error('No wallet connected');
        throw new Error('No wallet connected');
      }

      if (!context) {
        console.error('Not in mini app');
        throw new Error('Not in mini app');
      }

      const { token } = await sdk.quickAuth.getToken();
      if (!token) {
        console.error('Sign in failed, no farcaster token');
        throw new Error('Sign in failed');
      }

      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          fid: context.user.fid,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(errorData);
        throw new Error(errorData.message || 'Sign in failed');
      }

      const data = await res.json();
      setIsSignedIn(true);
      refetchUser();
      onSuccess?.(data.user);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, refetchUser, address]);

  useEffect(() => {
    if (autoSignIn && context && address) {
      if (!isSignedIn) {
        handleSignIn();
      }
    }
  }, [autoSignIn, handleSignIn, isSignedIn, context, address]);

  return { signIn: handleSignIn, isSignedIn, isLoading, error, user };
};
