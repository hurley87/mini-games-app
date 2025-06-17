'use client';

import { Sparkles, Info as InfoIcon } from 'lucide-react';
import Link from 'next/link';
import { HeaderProfile } from './header-profile';
import { WelcomeDialog } from './welcome-dialog';
import { trackGameEvent } from '@/lib/posthog';

export function Header() {
  const handleHomeClick = () => {
    trackGameEvent.navigationClick('home', 'header');
  };

  const handleInfoNavigation = () => {
    trackGameEvent.navigationClick('info', 'header');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 backdrop-blur-md bg-black/20 border-b border-white/20 shadow-xl">
      <Link href="/" onClick={handleHomeClick} className="hover:brightness-110 transition-all duration-200">
        <Sparkles className="w-6 h-6 text-purple-400" />
      </Link>
      
      <div className="flex items-center gap-3">
        <WelcomeDialog
          trigger={
            <button
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:brightness-110 transition-all duration-200"
              onClick={handleInfoNavigation}
            >
              <InfoIcon className="w-4 h-4" />
            </button>
          }
        />
        <HeaderProfile />
      </div>
    </header>
  );
}
