# Daily Play Limits Implementation

## Overview
Implemented a daily play limit system that restricts players to a maximum number of plays per day for each coin/game, based on the `max_plays` field in the coins table.

## Features Implemented

### 1. Rate Limiting System (`lib/rate-limit.ts`)
- Added `checkDailyPlayLimit()` method to track daily plays per coin using Redis
- Added `getDailyPlayCount()` method to get current play count without incrementing
- Uses Redis keys in format: `daily_plays:{fid}:{coinId}:{date}`
- Automatically expires keys after 24 hours

### 2. Play Status Checking (`app/api/check-play-status/route.ts`)
- Enhanced to check daily play limits before allowing play
- Returns new play status reason: `daily_limit_reached`
- Includes play limit information: `dailyPlaysRemaining`, `maxDailyPlays`, `currentDailyPlays`
- Checks coin's `max_plays` field (defaults to 3 if not set)

### 3. Score Awarding (`app/api/award/route.ts`)
- Added daily play limit validation before awarding scores
- Prevents players from scoring if they've exceeded daily play limit
- Returns appropriate error message when limit is exceeded

### 4. UI Updates (`components/info.tsx`)
- Added play counter display showing remaining plays
- Added warning section for when daily limit is reached
- Disabled play button when daily limit is reached
- Updated play handler to prevent play when limit reached

### 5. Game Wrapper (`components/game-wrapper.tsx`)
- Added safeguard to prevent game start when daily limit reached
- Additional validation layer before showing game

### 6. Type Updates (`hooks/usePlayStatus.ts`)
- Extended `PlayStatus` type with daily play limit fields
- Added new reason: `daily_limit_reached`

## How It Works

1. **Daily Play Tracking**: Each time a player plays a game, the system increments their daily play count for that specific coin in Redis

2. **Limit Checking**: Before allowing play, the system checks if the player has reached their daily limit for that coin

3. **UI Feedback**: Players see how many plays they have remaining and are prevented from playing when the limit is reached

4. **Reset**: Play counts automatically reset at midnight (24-hour TTL on Redis keys)

## Configuration

- Each coin has a `max_plays` field that determines the daily limit
- Default limit is 3 plays per day if `max_plays` is not set
- Limits are per-coin, so players can play different games up to each game's individual limit

## Database Schema

The system uses the existing `max_plays` field in the `coins` table and leverages Redis for efficient daily counting without additional database schema changes.