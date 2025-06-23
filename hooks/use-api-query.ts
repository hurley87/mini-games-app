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
        throw new Error('API request failed');
      }

      return response.json() as Promise<T>;
    },
    enabled,
  });
}
