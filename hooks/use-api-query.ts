import { useQuery } from '@tanstack/react-query';

interface UseApiQueryOptions<T> {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  isProtected?: boolean;
  queryKey: string[];
  enabled?: boolean;
}

export function useApiQuery<T>({
  url,
  method,
  isProtected,
  queryKey,
  enabled = true,
}: UseApiQueryOptions<T>) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Handle token expiration specifically
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.code === 'TOKEN_EXPIRED') {
            throw new Error('Session expired. Please sign in again.');
          }
          throw new Error('Authentication required. Please sign in.');
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      return response.json() as Promise<T>;
    },
    enabled,
  });
}
