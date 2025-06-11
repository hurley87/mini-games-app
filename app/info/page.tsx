'use client';

import { Header } from '@/app/components/header';
import { 
  Sparkles, 
  Trophy, 
  Coins, 
  Users, 
  TrendingUp, 
  Shield,
  Zap,
  Heart,
  ChevronRight,
  Info,
  DollarSign,
  Play,
  Store,
  Gift,
  Wallet,
  GameController2,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function InfoPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const features = [
    {
      icon: GameController2,
      title: "Play Onchain Games",
      description: "Quick, fun mini-games built directly on the blockchain",
      color: "text-purple-400"
    },
    {
      icon: Coins,
      title: "Earn Tokens",
      description: "Each game has its own token that can be earned through gameplay",
      color: "text-yellow-400"
    },
    {
      icon: TrendingUp,
      title: "Trade on Zora",
      description: "All game tokens are tradeable on Zora's decentralized marketplace",
      color: "text-green-400"
    },
    {
      icon: Trophy,
      title: "Compete & Win",
      description: "Climb leaderboards and earn rewards based on your performance",
      color: "text-blue-400"
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Choose a Game",
      description: "Browse our collection of mini-games and pick one that interests you",
      icon: Target
    },
    {
      step: 2,
      title: "Play Your First Round",
      description: "Get a free trial on your first play, then use tokens for unlimited access",
      icon: Play
    },
    {
      step: 3,
      title: "Submit Your Score",
      description: "Your performance is recorded onchain and added to the leaderboard",
      icon: Trophy
    },
    {
      step: 4,
      title: "Earn Rewards",
      description: "Top players receive token rewards distributed by game creators",
      icon: Gift
    }
  ];

  const tokenomics = [
    {
      icon: Store,
      title: "Direct Purchase",
      description: "Buy tokens directly from the game page at the current market price",
      highlight: "0.001 tokens minimum"
    },
    {
      icon: Gift,
      title: "Creator Rewards",
      description: "Game creators can distribute tokens to top performers",
      highlight: "Performance-based"
    },
    {
      icon: TrendingUp,
      title: "Market Trading",
      description: "Trade tokens on Zora like any other ERC-20 asset",
      highlight: "Fully liquid"
    },
    {
      icon: Wallet,
      title: "Wallet Integration",
      description: "Tokens transfer directly to your connected wallet",
      highlight: "Self-custody"
    }
  ];

  const faqs = [
    {
      question: "What do I need to start playing?",
      answer: "You just need a Farcaster account! Each game offers a free first play. After that, you'll need to hold at least 0.001 of the game's token to continue playing."
    },
    {
      question: "How do game tokens work?",
      answer: "Each game deploys its own ERC-20 token on Base. These tokens grant access to play the game and can be earned through gameplay, purchased directly, or traded on secondary markets."
    },
    {
      question: "Can I create my own game?",
      answer: "Yes! Mini Games is a platform for creators. You can build and deploy your own games, set up token economics, and distribute rewards to players."
    },
    {
      question: "Are my scores stored onchain?",
      answer: "Game scores and leaderboards are currently stored off-chain for efficiency, but token ownership and transfers happen entirely onchain."
    },
    {
      question: "What blockchain is this built on?",
      answer: "Mini Games is built on Base, an Ethereum Layer 2 that offers fast, affordable transactions perfect for gaming."
    },
    {
      question: "How do I withdraw my tokens?",
      answer: "Tokens are automatically sent to your connected wallet. You can manage them like any other cryptocurrency - send, trade, or hold them."
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl backdrop-blur-sm border border-purple-500/20">
              <Sparkles className="w-12 h-12 text-purple-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Welcome to Mini Games
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            The first platform for tokenized onchain games in Farcaster Frames. 
            Play, earn, and trade game tokens in a decentralized gaming ecosystem.
          </p>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 bg-white/10 rounded-lg ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How It Works Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            How It Works
          </h2>
          <div className="space-y-4">
            {howItWorks.map((step, index) => (
              <div 
                key={index}
                className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {step.step}
                </div>
                <div className="flex-shrink-0 p-2 bg-white/10 rounded-lg text-purple-400">
                  <step.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{step.title}</h3>
                  <p className="text-sm text-white/70">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Token Economics Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-400" />
            Token Economics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tokenomics.map((item, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-start space-x-3 mb-3">
                  <div className="p-2 bg-white/10 rounded-lg text-green-400">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{item.title}</h3>
                    <p className="text-xs text-green-400 font-medium mt-1">{item.highlight}</p>
                  </div>
                </div>
                <p className="text-sm text-white/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-12 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl p-8 border border-purple-500/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-400" />
            Why Mini Games?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Shield className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="text-white font-semibold mb-2">Fully Decentralized</h3>
              <p className="text-sm text-white/70">
                Your tokens and achievements are stored onchain, giving you true ownership
              </p>
            </div>
            <div>
              <Users className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-white font-semibold mb-2">Community Driven</h3>
              <p className="text-sm text-white/70">
                Built by and for the Farcaster community with creator-first economics
              </p>
            </div>
            <div>
              <Zap className="w-8 h-8 text-yellow-400 mb-3" />
              <h3 className="text-white font-semibold mb-2">Instant Access</h3>
              <p className="text-sm text-white/70">
                Play directly in Farcaster frames - no app downloads or installations
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-400" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <span className="text-white font-medium">{faq.question}</span>
                  <ChevronRight 
                    className={`w-5 h-5 text-white/50 transition-transform ${
                      expandedFaq === index ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-white/70">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-2xl p-8 border border-purple-500/20">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Playing?</h2>
          <p className="text-white/70 mb-6">
            Join thousands of players earning and trading game tokens
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-full transition-colors"
          >
            <GameController2 className="w-5 h-5" />
            Browse Games
          </Link>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a 
              href="https://zora.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white/70 transition-colors"
            >
              Zora Marketplace
            </a>
            <a 
              href="https://base.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white/70 transition-colors"
            >
              Built on Base
            </a>
            <a 
              href="https://warpcast.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white/70 transition-colors"
            >
              Farcaster
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
