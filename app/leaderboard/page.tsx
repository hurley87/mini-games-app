'use client';

import { LeaderboardView } from '../components/LeaderboardView';
import { Nav } from '../components/Nav';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
      <Nav />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <LeaderboardView />
        </div>
      </div>
    </div>
  );
}
