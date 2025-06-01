'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp, Search, MessageCircle } from 'lucide-react';

interface Build {
  id: string;
  name: string;
  description: string;
  image: string;
  coin_address: string;
}

export function BuildsView() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuilds = async () => {
      try {
        const response = await fetch('/api/builds');
        if (!response.ok) {
          throw new Error('Failed to load builds');
        }
        const data = await response.json();
        setBuilds(data);
      } catch (err) {
        setError('Failed to load builds');
        console.error('Error fetching builds:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuilds();
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
    <main className="flex-1 overflow-auto">
      {builds.map((build) => (
        <div key={build.id} className="border-b pb-4">
          {/* Post Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                  <Image
                    src="/placeholder.svg?height=40&width=40"
                    alt="Profile"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div className="absolute -right-1 -bottom-1 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  +
                </div>
              </div>
              <span className="font-bold">{build.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">11m</span>
              <button className="text-gray-500">•••</button>
            </div>
          </div>

          {/* Post Image */}
          <div className="relative">
            <Image
              src={build.image || '/placeholder.svg?height=500&width=500'}
              alt="Post image"
              width={500}
              height={500}
              className="w-full aspect-square object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="text-white text-6xl font-bold">{build.name}</h1>
            </div>
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="text-green-500 flex items-center">
                  <ArrowUp className="w-5 h-5 fill-green-500 stroke-green-500" />
                  <span className="font-bold">$65</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-gray-700">
                <div className="flex items-center">
                  <Search className="w-5 h-5" />
                  <span className="ml-1">3</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-gray-700">
                <MessageCircle className="w-5 h-5" />
                <span>0</span>
              </div>
              <div className="flex items-center gap-1 text-gray-700">
                <ArrowUp className="w-5 h-5 rotate-180" />
              </div>
            </div>
            <Link href={`/builds/${build.id}`}>
              <button className="bg-green-500 text-white px-8 py-2 rounded-full font-bold">
                Buy
              </button>
            </Link>
          </div>

          {/* Post Title */}
          <div className="px-4 pb-2">
            <h2 className="text-xl font-bold">{build.name}</h2>
          </div>
        </div>
      ))}
    </main>
  );
}
