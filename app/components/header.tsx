import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { HeaderProfile } from './header-profile';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 border-b bg-white">
      <Link href="/">
        <h1 className="text-lg font-bold text-gray-800">Mini Games</h1>
      </Link>
      <div className="flex items-center gap-6">
        <Trophy className="w-6 h-6 text-gray-400" />
        <HeaderProfile />
      </div>
    </header>
  );
}
