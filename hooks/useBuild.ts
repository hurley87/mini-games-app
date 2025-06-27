import { useApiQuery } from './use-api-query';

interface Build {
  id: string;
  title: string;
  image: string;
  description: string;
  html: string;
  tutorial: string;
}

export function useBuild(buildId: string | null | undefined) {
  return useApiQuery<Build>({
    url: `/api/builds/${buildId}`,
    method: 'GET',
    queryKey: ['build', buildId || ''],
    enabled: !!buildId,
  });
}
