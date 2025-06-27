import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  reservationId?: string; // For play reservations
}

export class RateLimiter {
  /**
   * Check if a user has exceeded their daily points limit
   * @param fid The user's FID
   * @param points The points they're trying to earn
   * @param dailyLimit The maximum points per day
   * @returns Whether the request should be allowed
   */
  static async checkDailyPointsLimit(
    fid: number,
    points: number,
    dailyLimit: number = 10000
  ): Promise<RateLimitResult> {
    const key = `daily_points:${fid}:${new Date().toISOString().split('T')[0]}`;
    const ttl = 86400; // 24 hours in seconds

    try {
      // Get current points for today
      const currentPoints = (await redis.get<number>(key)) || 0;

      // Check if adding these points would exceed the limit
      if (currentPoints + points > dailyLimit) {
        return {
          success: false,
          limit: dailyLimit,
          remaining: Math.max(0, dailyLimit - currentPoints),
          reset: Date.now() + ttl * 1000,
        };
      }

      // Increment the counter
      await redis.incrby(key, points);
      await redis.expire(key, ttl);

      return {
        success: true,
        limit: dailyLimit,
        remaining: dailyLimit - (currentPoints + points),
        reset: Date.now() + ttl * 1000,
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      // Allow the request if Redis is down
      return {
        success: true,
        limit: dailyLimit,
        remaining: dailyLimit,
        reset: Date.now() + ttl * 1000,
      };
    }
  }

  /**
   * Check general API rate limit
   * @param identifier The identifier (e.g., FID or IP)
   * @param limit The number of requests allowed
   * @param window The time window in seconds
   * @returns Whether the request should be allowed
   */
  static async checkRateLimit(
    identifier: string,
    limit: number = 100,
    window: number = 3600
  ): Promise<RateLimitResult> {
    const key = `rate_limit:${identifier}`;

    try {
      const multi = redis.multi();
      multi.incr(key);
      multi.expire(key, window);
      const results = await multi.exec();

      const count = (results?.[0] as number) || 1;

      return {
        success: count <= limit,
        limit,
        remaining: Math.max(0, limit - count),
        reset: Date.now() + window * 1000,
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      // Allow the request if Redis is down
      return {
        success: true,
        limit,
        remaining: limit,
        reset: Date.now() + window * 1000,
      };
    }
  }

  /**
   * Reserve a play slot at game start to prevent race conditions
   * @param fid The user's FID
   * @param coinId The coin/game ID
   * @param maxPlays The maximum plays per day for this coin
   * @returns Whether the reservation was successful and a reservation ID
   */
  static async reserveDailyPlaySlot(
    fid: number,
    coinId: string,
    maxPlays: number
  ): Promise<RateLimitResult> {
    const dateStr = new Date().toISOString().split('T')[0];
    const playsKey = `daily_plays:${fid}:${coinId}:${dateStr}`;
    const reservationsKey = `play_reservations:${fid}:${coinId}:${dateStr}`;
    const ttl = 86400; // 24 hours in seconds
    const reservationTtl = 1800; // 30 minutes for reservations

    try {
      // Create a unique reservation ID (fixed deprecated substr)
      const reservationId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const reservationDetailKey = `reservation:${reservationId}`;

      // Atomic check-and-reserve using Lua script to prevent race conditions
      const luaScript = `
        local playsKey = KEYS[1]
        local reservationsKey = KEYS[2]
        local reservationDetailKey = KEYS[3]
        local maxPlays = tonumber(ARGV[1])
        local ttl = tonumber(ARGV[2])
        local reservationTtl = tonumber(ARGV[3])
        local reservationId = ARGV[4]
        local reservationData = ARGV[5]
        
        -- Get current committed plays and active reservations
        local currentPlays = redis.call('GET', playsKey) or 0
        local reservations = redis.call('SMEMBERS', reservationsKey) or {}
        
        -- Calculate total used slots (committed + reserved)
        local totalUsedSlots = tonumber(currentPlays) + #reservations
        
        -- Check if we can reserve a slot
        if totalUsedSlots >= maxPlays then
          return {0, totalUsedSlots, maxPlays}
        end
        
        -- Add reservation to the set with expiration
        redis.call('SADD', reservationsKey, reservationId)
        redis.call('EXPIRE', reservationsKey, ttl)
        
        -- Set individual reservation with shorter TTL for cleanup
        redis.call('SETEX', reservationDetailKey, reservationTtl, reservationData)
        
        -- Return success with updated counts
        return {1, totalUsedSlots + 1, maxPlays}
      `;

      const reservationData = JSON.stringify({
        fid,
        coinId,
        dateStr,
        created: Date.now(),
      });

      const result = (await redis.eval(
        luaScript,
        [playsKey, reservationsKey, reservationDetailKey],
        [
          maxPlays.toString(),
          ttl.toString(),
          reservationTtl.toString(),
          reservationId,
          reservationData,
        ]
      )) as [number, number, number];

      const [success, totalUsedSlots, limit] = result;

      if (success === 0) {
        return {
          success: false,
          limit,
          remaining: Math.max(0, limit - totalUsedSlots),
          reset: Date.now() + ttl * 1000,
        };
      }

      return {
        success: true,
        limit,
        remaining: limit - totalUsedSlots,
        reset: Date.now() + ttl * 1000,
        reservationId,
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      // Allow the request if Redis is down
      return {
        success: true,
        limit: maxPlays,
        remaining: maxPlays - 1,
        reset: Date.now() + ttl * 1000,
        reservationId: `fallback-${Date.now()}`,
      };
    }
  }

  /**
   * Commit a reserved play slot after successful game completion
   * @param fid The user's FID
   * @param coinId The coin/game ID
   * @param reservationId The reservation ID from reserveDailyPlaySlot
   * @returns Whether the commit was successful
   */
  static async commitDailyPlaySlot(
    fid: number,
    coinId: string,
    reservationId: string
  ): Promise<boolean> {
    const dateStr = new Date().toISOString().split('T')[0];
    const playsKey = `daily_plays:${fid}:${coinId}:${dateStr}`;
    const reservationsKey = `play_reservations:${fid}:${coinId}:${dateStr}`;
    const reservationDetailKey = `reservation:${reservationId}`;
    const ttl = 86400; // 24 hours in seconds

    try {
      // Verify the reservation exists and belongs to this user/game
      const reservationData = await redis.get<string>(reservationDetailKey);
      if (!reservationData) {
        console.warn('Reservation not found or expired:', reservationId);
        return false;
      }

      const reservation = JSON.parse(reservationData);
      if (
        reservation.fid !== fid ||
        reservation.coinId !== coinId ||
        reservation.dateStr !== dateStr
      ) {
        console.error('Reservation mismatch:', {
          reservation,
          fid,
          coinId,
          dateStr,
        });
        return false;
      }

      // Remove reservation and increment committed plays atomically
      const multi = redis.multi();
      multi.srem(reservationsKey, reservationId);
      multi.del(reservationDetailKey);
      multi.incr(playsKey);
      multi.expire(playsKey, ttl);
      await multi.exec();

      return true;
    } catch (error) {
      console.error('Error committing play slot:', error);
      // In case of error, still try to clean up the reservation
      try {
        const multi = redis.multi();
        multi.srem(reservationsKey, reservationId);
        multi.del(reservationDetailKey);
        await multi.exec();
      } catch (cleanupError) {
        console.error('Error cleaning up reservation:', cleanupError);
      }
      return false;
    }
  }

  /**
   * Release a reserved play slot if game is abandoned or fails
   * @param fid The user's FID
   * @param coinId The coin/game ID
   * @param reservationId The reservation ID from reserveDailyPlaySlot
   * @returns Whether the release was successful
   */
  static async releaseDailyPlaySlot(
    fid: number,
    coinId: string,
    reservationId: string
  ): Promise<boolean> {
    const dateStr = new Date().toISOString().split('T')[0];
    const reservationsKey = `play_reservations:${fid}:${coinId}:${dateStr}`;
    const reservationDetailKey = `reservation:${reservationId}`;

    try {
      // Remove reservation
      const multi = redis.multi();
      multi.srem(reservationsKey, reservationId);
      multi.del(reservationDetailKey);
      await multi.exec();

      return true;
    } catch (error) {
      console.error('Error releasing play slot:', error);
      return false;
    }
  }

  /**
   * Check if a user has exceeded their daily play limit for a specific coin
   * @param fid The user's FID
   * @param coinId The coin/game ID
   * @param maxPlays The maximum plays per day for this coin
   * @returns Whether the request should be allowed
   * @deprecated Use reserveDailyPlaySlot and commitDailyPlaySlot instead
   */
  static async checkDailyPlayLimit(
    fid: number,
    coinId: string,
    maxPlays: number
  ): Promise<RateLimitResult> {
    const key = `daily_plays:${fid}:${coinId}:${new Date().toISOString().split('T')[0]}`;
    const ttl = 86400; // 24 hours in seconds

    try {
      // Get current plays for today for this specific coin
      const currentPlays = (await redis.get<number>(key)) || 0;

      // Check if adding one more play would exceed the limit
      if (currentPlays >= maxPlays) {
        return {
          success: false,
          limit: maxPlays,
          remaining: Math.max(0, maxPlays - currentPlays),
          reset: Date.now() + ttl * 1000,
        };
      }

      // Increment the counter
      await redis.incr(key);
      await redis.expire(key, ttl);

      return {
        success: true,
        limit: maxPlays,
        remaining: maxPlays - (currentPlays + 1),
        reset: Date.now() + ttl * 1000,
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      // Allow the request if Redis is down
      return {
        success: true,
        limit: maxPlays,
        remaining: maxPlays - 1,
        reset: Date.now() + ttl * 1000,
      };
    }
  }

  /**
   * Get current daily play count for a specific coin without incrementing
   * @param fid The user's FID
   * @param coinId The coin/game ID
   * @returns The current play count for today
   */
  static async getDailyPlayCount(fid: number, coinId: string): Promise<number> {
    const dateStr = new Date().toISOString().split('T')[0];
    const playsKey = `daily_plays:${fid}:${coinId}:${dateStr}`;
    const reservationsKey = `play_reservations:${fid}:${coinId}:${dateStr}`;

    try {
      // Get both committed plays and active reservations
      const [currentPlaysResult, reservationsResult] = await Promise.all([
        redis.get<number>(playsKey),
        redis.smembers<string[]>(reservationsKey),
      ]);

      const currentPlays = currentPlaysResult || 0;
      const reservations = reservationsResult || [];

      // Return total used slots (committed + reserved)
      return currentPlays + reservations.length;
    } catch (error) {
      console.error('Error getting daily play count:', error);
      return 0;
    }
  }
}
