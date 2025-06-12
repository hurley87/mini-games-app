import { Header } from '@/app/components/header';

export default function InfoPage() {
  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <Header />
      <div className="px-4 pt-20 pb-8 space-y-6">
        <h1 className="text-xl font-bold text-white">How Mini Games Work</h1>
        <p className="text-white/70">
          Mini Games lets you play quick onchain games directly in Farcaster.
          Each game has its own token that can be earned or traded on Zora.
        </p>
        <h2 className="text-sm font-semibold text-white">Playing Games</h2>
        <p className="text-white/70">
          Choose a game from the list, play a round and submit your score. High
          scores earn points. Tokens are distributed to your wallet after the
          game.
        </p>
        <h2 className="text-sm font-semibold text-white">Economics</h2>
        <p className="text-white/70">
          Every game deploys a Zora token. You can buy tokens directly from the
          game page and they transfer to your connected wallet.
        </p>
      </div>
    </div>
  );
}
