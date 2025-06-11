import { Header } from '@/app/components/header';

export default function InfoPage() {
  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <Header />
      <div className="px-4 pt-20 pb-8 space-y-6">
        <h1 className="text-xl font-bold text-white">How Mini Games Work</h1>
        <p className="text-white/70">
          Mini Games lets you play quick onchain games directly in Farcaster Frames.
          Each game has its own token that can be earned or traded on Zora.
        </p>
        <h2 className="text-sm font-semibold text-white">Playing Games</h2>
        <p className="text-white/70">
          Choose a game from the list, play a round and submit your score. High scores
          earn points and may unlock token rewards from the creator.
        </p>
        <h2 className="text-sm font-semibold text-white">Economics</h2>
        <p className="text-white/70">
          Every game deploys a Zora token. You can buy tokens directly from the game
          page and they transfer to your connected wallet. Some games distribute
          tokens based on your performance or leaderboard position.
        </p>
        <p className="text-white/70">
          Tokens are tradeable like any other Zora ERC‑20 asset. Check each game
          description for details on how its economy works and how many tokens are
          awarded for playing.
        </p>
      </div>
    </div>
  );
}
