# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture Overview

This is a Next.js 14 mini-app/frame built for Farcaster using:

### Core Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Supabase** for database and backend services
- **Farcaster Frame SDK** for Frame/MiniApp functionality

### Key Integrations

- **Farcaster Ecosystem**: Frame SDK, Neynar SDK, Quick Auth
- **Zora Coins SDK**: For token/coin interactions
- **Sentry**: Error monitoring and performance tracking
- **PostHog**: Analytics
- **OpenAI**: AI-powered features
- **Upstash Redis**: Caching and queue management

### Architecture Patterns

**Database Layer (`lib/supabase.ts`)**

- Centralized Supabase service with typed operations
- Atomic operations for game plays with race condition handling
- Daily streak tracking and leaderboard functionality
- Player management with wallet integration

**Authentication & Middleware**

- JWT-based authentication via cookies (`middleware.ts`)
- Protected API routes with FID (Farcaster ID) injection
- Bypass auth for public endpoints (og, webhooks, coins, builds)

**Context Architecture**

- `MiniAppProvider`: Frame SDK initialization and wallet integration
- `FrameWalletProvider`: Wallet connection management
- Context composition for clean separation of concerns

**API Structure**

- RESTful API routes under `/app/api/`
- Background job processing via `/api/process-queue`
- Webhook handlers for external integrations
- OpenGraph image generation at `/api/og/[coinId]`

**Game System**

- Coin-based games with play limits and scoring
- Daily play tracking with atomic increment operations
- Token multipliers and premium thresholds configurable via env vars
- Leaderboard system with rank calculations

### Key Files

- `lib/types.ts` - Core type definitions for Coin, Build, Creator entities
- `lib/supabase.ts` - Database service layer with atomic operations
- `middleware.ts` - JWT authentication and FID injection
- `contexts/miniapp-context.tsx` - Frame SDK initialization
- `lib/config.ts` - Application configuration constants

### Database Schema (Supabase)

Key tables referenced in code:

- `players` - User profiles with FID, wallet, points
- `coins` - Game coins with metadata and configuration
- `builds` - Game build definitions
- `daily_streaks` - Login streak tracking
- `daily_plays` - Play count limits per coin per day
- `scores` - Game scores for leaderboards
- `notifications` - Push notification tokens

### Environment Variables

Critical env vars from README:

- JWT authentication: `JWT_SECRET`
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Game config: `NEXT_PUBLIC_TOKEN_MULTIPLIER`, `NEXT_PUBLIC_PREMIUM_THRESHOLD`
- Farcaster frame metadata and Redis config for webhooks

### Development Notes

- Uses atomic database operations to prevent race conditions in play counting
- Frame metadata configured for Farcaster integration
- Custom middleware handles auth for API routes
- OpenGraph images generated dynamically for coins
- Background task processing with queue system

## Code Formatting

A Claude Code hook is configured in `.claude/hooks.json` to automatically format code using Prettier after edits. The hook applies to TypeScript, JavaScript, JSON, CSS, and Markdown files, using the project's Prettier configuration:

- Single quotes, semicolons enabled
- 2-space tabs, 80 character line width
- ES5 trailing commas, LF line endings
