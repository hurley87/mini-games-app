'use client';

import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { HeaderProfile } from './header-profile';
import { trackGameEvent } from '@/lib/posthog';

export function Header() {
  const handleHomeClick = () => {
    trackGameEvent.navigationClick('home', 'header');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
      <Link href="/" onClick={handleHomeClick}>
        <Sparkles className="w-6 h-6 text-purple-400" />
      </Link>
      <HeaderProfile />
    </header>
  );
}
