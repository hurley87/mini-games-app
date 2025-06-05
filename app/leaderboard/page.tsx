import { Leaderboard } from '@/components/leaderboard';
import { Header } from '@/app/components/header';

export default function LeaderboardPage() {
  return (
    <div className="max-w-md mx-auto bg-gray-900 min-h-screen flex flex-col">
      <Header />
      <div className="px-4 pt-20 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-white mb-2">Player Rankings</h1>
          <p className="text-gray-400">
            See how you stack up against other players
          </p>
        </div>

        <div className="space-y-6">
          {/* Top 10 Leaderboard */}
          <div>
            <h2 className="text-sm font-semibold text-gray-200 mb-4">
              Top 5 Players
            </h2>
            <Leaderboard limit={5} />
          </div>
          {/* Full Leaderboard */}
          <div>
            <h2 className="text-sm font-semibold text-gray-200 mb-4">
              All Players
            </h2>
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
}
