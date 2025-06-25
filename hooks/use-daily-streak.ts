import { useApiQuery } from './use-api-query';

export function useDailyStreak(enabled = true) {
  return useApiQuery<{ streak: number; claimed: boolean }>({
    url: '/api/daily-streak',
    method: 'GET',
    isProtected: true,
    queryKey: ['daily-streak'],
    enabled,
  });
}
