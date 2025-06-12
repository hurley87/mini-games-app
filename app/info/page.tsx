import { Header } from '@/app/components/header';
import {
  Gamepad2,
  Coins,
  Trophy,
  Wallet,
  TrendingUp,
  Users,
  Sparkles,
  Shield,
  Zap,
  HelpCircle,
  PlayCircle,
  CheckCircle,
  Info,
  ArrowRight,
  Star,
  Lock,
  Unlock,
} from 'lucide-react';
import { PREMIUM_THRESHOLD } from '@/lib/config';

export default function InfoPage() {
  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <Header />
      <div className="pt-16 pb-8">
        {/* Hero Section */}
        <div className="px-4 py-8 text-center border-b border-white/10">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Gamepad2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Mini Games Studio
          </h1>
          <p className="text-white/70 max-w-sm mx-auto">
            Play onchain games, earn tokens, and compete with the Farcaster
            community
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 px-4 py-6 border-b border-white/10">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Gamepad2 className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">50+</div>
            <div className="text-xs text-white/60">Games</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">10k+</div>
            <div className="text-xs text-white/60">Players</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Coins className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">$1M+</div>
            <div className="text-xs text-white/60">Volume</div>
          </div>
        </div>

        <div className="px-4 space-y-8 py-8">
          {/* How It Works */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-purple-400" />
              How It Works
            </h2>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-purple-400">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      Choose a Game
                    </h3>
                    <p className="text-sm text-white/70">
                      Browse our collection of mini games, each with unique
                      gameplay and its own token
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-400">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      Play & Compete
                    </h3>
                    <p className="text-sm text-white/70">
                      Play rounds, submit your scores, and climb the leaderboard
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-emerald-400">
                      3
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      Earn Tokens
                    </h3>
                    <p className="text-sm text-white/70">
                      Receive game tokens based on your performance and
                      achievements
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Token Economics */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Token Economics
            </h2>
            <div className="bg-gradient-to-br from-emerald-900/20 to-blue-900/20 rounded-xl p-4 border border-emerald-500/20">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Coins className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      Zora-Powered Tokens
                    </h3>
                    <p className="text-sm text-white/70">
                      Every game deploys its own token on Base using Zora,
                      enabling instant trading and low fees
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Wallet className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      Direct to Wallet
                    </h3>
                    <p className="text-sm text-white/70">
                      Tokens transfer directly to your connected wallet after
                      each game
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      Trade & Hold
                    </h3>
                    <p className="text-sm text-white/70">
                      Buy, sell, or hold tokens to support your favorite games
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Premium Access */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Premium Access
            </h2>
            <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-xl p-4 border border-yellow-500/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold text-white">Free Play</span>
                  </div>
                  <span className="text-sm text-white/70">
                    Limited plays per day
                  </span>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Unlock className="w-5 h-5 text-yellow-400" />
                      <span className="font-semibold text-white">
                        Premium Play
                      </span>
                    </div>
                    <span className="text-sm font-bold text-yellow-400">
                      Unlimited
                    </span>
                  </div>

                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-sm text-white/90 mb-2">
                      Hold{' '}
                      <span className="font-bold text-yellow-400">
                        {PREMIUM_THRESHOLD.toLocaleString()}
                      </span>{' '}
                      tokens of any game to unlock:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-white/80">
                          Unlimited plays
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-white/80">
                          Priority access to new games
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-white/80">
                          Exclusive tournaments
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-400" />
              Features
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Trophy className="w-6 h-6 text-yellow-400 mb-2" />
                <h3 className="font-semibold text-white text-sm mb-1">
                  Leaderboards
                </h3>
                <p className="text-xs text-white/60">Compete globally</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Zap className="w-6 h-6 text-purple-400 mb-2" />
                <h3 className="font-semibold text-white text-sm mb-1">
                  Instant Play
                </h3>
                <p className="text-xs text-white/60">No downloads</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Shield className="w-6 h-6 text-emerald-400 mb-2" />
                <h3 className="font-semibold text-white text-sm mb-1">
                  Secure
                </h3>
                <p className="text-xs text-white/60">Fully onchain</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Users className="w-6 h-6 text-blue-400 mb-2" />
                <h3 className="font-semibold text-white text-sm mb-1">
                  Social
                </h3>
                <p className="text-xs text-white/60">Share & compete</p>
              </div>
            </div>
          </section>

          {/* FAQs */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              <details className="bg-white/5 rounded-xl border border-white/10 group">
                <summary className="p-4 cursor-pointer flex items-center justify-between font-semibold text-white">
                  <span>How do I start playing?</span>
                  <Info className="w-4 h-4 text-white/60 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-4 pb-4 text-sm text-white/70">
                  Simply connect your wallet, choose a game, and start playing!
                  You get a few free plays daily, or hold tokens for unlimited
                  access.
                </div>
              </details>

              <details className="bg-white/5 rounded-xl border border-white/10 group">
                <summary className="p-4 cursor-pointer flex items-center justify-between font-semibold text-white">
                  <span>What are game tokens used for?</span>
                  <Info className="w-4 h-4 text-white/60 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-4 pb-4 text-sm text-white/70">
                  Game tokens can be traded on Zora, held for premium access, or
                  used in future game features and tournaments.
                </div>
              </details>

              <details className="bg-white/5 rounded-xl border border-white/10 group">
                <summary className="p-4 cursor-pointer flex items-center justify-between font-semibold text-white">
                  <span>How do I get premium access?</span>
                  <Info className="w-4 h-4 text-white/60 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-4 pb-4 text-sm text-white/70">
                  Hold at least {PREMIUM_THRESHOLD.toLocaleString()} tokens from
                  any game to unlock unlimited plays and exclusive features.
                </div>
              </details>

              <details className="bg-white/5 rounded-xl border border-white/10 group">
                <summary className="p-4 cursor-pointer flex items-center justify-between font-semibold text-white">
                  <span>Are the games free to play?</span>
                  <Info className="w-4 h-4 text-white/60 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-4 pb-4 text-sm text-white/70">
                  Yes! All games offer free daily plays. You can purchase tokens
                  for premium access or to support your favorite games.
                </div>
              </details>
            </div>
          </section>

          {/* CTA Section */}
          <section className="pt-4">
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/20 text-center">
              <h3 className="text-lg font-bold text-white mb-2">
                Ready to Play?
              </h3>
              <p className="text-sm text-white/70 mb-4">
                Join thousands of players in the Farcaster gaming revolution
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-full transition-colors"
              >
                Browse Games
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
