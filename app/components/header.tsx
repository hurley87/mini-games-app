import { Trophy, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { HeaderProfile } from './header-profile';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 border-b bg-white">
      <Link href="/">
        <Sparkles className="w-6 h-6 text-gray-400" />
      </Link>
      <div className="flex items-center gap-6">
        <Trophy className="w-6 h-6 text-gray-400" />
        <HeaderProfile />
      </div>
    </header>
  );
}
