'use client';

import { useEffect, type ReactNode, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog, trackPageView } from '@/lib/posthog';

interface PostHogProviderProps {
  children: ReactNode;
}

function PostHogPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views when route changes
  useEffect(() => {
    if (pathname) {
      const url = window.location.href;
      const pageName = getPageName(pathname);

      trackPageView(pageName, {
        pathname,
        search_params: searchParams.toString(),
        full_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  // Initialize PostHog on mount
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageTracker />
      </Suspense>
      {children}
    </>
  );
}

// Helper function to get readable page names
function getPageName(pathname: string): string {
  if (pathname === '/') return 'Home';
  if (pathname === '/leaderboard') return 'Leaderboard';
  if (pathname === '/info') return 'Info';
  if (pathname.startsWith('/coins/')) return 'Game';

  // Convert pathname to readable format
  return pathname
    .split('/')
    .filter(Boolean)
    .join(' ')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
