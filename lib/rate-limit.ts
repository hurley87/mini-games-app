import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
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
}
