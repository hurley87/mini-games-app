'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface User {
  fid: number;
  name: string;
  username: string;
  pfp: string;
  points: number;
}

export function LeaderboardView() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
          throw new Error('Failed to load leaderboard');
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError('Failed to load leaderboard');
        console.error('Error fetching leaderboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700/50">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Leaderboard
          </h2>
          <p className="text-gray-400 mt-2">Top players by points</p>
        </div>
        <div className="divide-y divide-gray-700/50">
          {users.map((user, index) => (
            <div
              key={user.fid}
              className="p-4 flex items-center space-x-4 hover:bg-gray-700/20 transition-colors"
            >
              <div className="w-8 text-center">
                <span
                  className={`text-lg font-bold ${
                    index === 0
                      ? 'text-yellow-400'
                      : index === 1
                        ? 'text-gray-400'
                        : index === 2
                          ? 'text-amber-600'
                          : 'text-gray-500'
                  }`}
                >
                  #{index + 1}
                </span>
              </div>
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={user.pfp || '/default-avatar.png'}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{user.name}</h3>
                <p className="text-sm text-gray-400">@{user.username}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-400">
                  {user.points || 0}
                </div>
                <div className="text-xs text-gray-400">points</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
