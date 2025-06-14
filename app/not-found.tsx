import Link from 'next/link';
import { Button } from './components/ui/button';

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-zinc-900 to-black text-white px-4">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-zinc-400">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-zinc-400 max-w-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/">
            <Button className="w-full bg-white text-black hover:bg-zinc-200 font-medium">
              Go Home
            </Button>
          </Link>

          <Link href="/leaderboard">
            <Button
              variant="outline"
              className="w-full border-zinc-700 text-white hover:bg-zinc-800"
            >
              View Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
