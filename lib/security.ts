import { getUserByFid } from '@/lib/neynar';
import { supabaseService } from '@/lib/supabase';

export class SecurityService {
  /**
   * Verify that a FID exists on Farcaster
   * @param fid The FID to verify
   * @returns Whether the FID exists
   */
  static async verifyFidExists(fid: number): Promise<boolean> {
    try {
      const user = await getUserByFid(fid);
      return !!user;
    } catch (error) {
      console.error(`Failed to verify FID ${fid}:`, error);
      return false;
    }
  }

  /**
   * Verify that a player has actually played a game before awarding points
   * @param fid The player's FID
   * @param gameId The game ID
   * @returns Whether the player has played the game
   */
  static async verifyGamePlay(fid: number, gameId: string): Promise<boolean> {
    try {
      return await supabaseService.hasPlayerPlayedGame(fid, gameId);
    } catch (error) {
      console.error(`Failed to verify game play for FID ${fid}:`, error);
      return false;
    }
  }

  /**
   * Validate score submission
   * @param score The score to validate
   * @param gameId The game ID
   * @returns Whether the score is valid
   */
  static async validateScore(score: number, gameId: string): Promise<boolean> {
    // Basic validation
    if (!Number.isFinite(score) || score <= 0) {
      return false;
    }

    // Add game-specific score limits here
    const maxScorePerGame: Record<string, number> = {
      default: 1000, // Default max score
      // Add specific game limits as needed
    };

    const maxScore = maxScorePerGame[gameId] || maxScorePerGame['default'];

    if (score > maxScore) {
      console.warn(
        `Score ${score} exceeds max allowed ${maxScore} for game ${gameId}`
      );
      return false;
    }

    return true;
  }

  /**
   * Validate request timing to prevent replay attacks
   * @param timestamp The request timestamp
   * @param maxAgeSeconds Maximum age of the request in seconds
   * @returns Whether the request is within the time window
   */
  static validateRequestTiming(
    timestamp: number,
    maxAgeSeconds: number = 300 // 5 minutes
  ): boolean {
    const now = Date.now();
    const requestTime = timestamp * 1000; // Convert to milliseconds if needed
    const age = Math.abs(now - requestTime) / 1000;

    return age <= maxAgeSeconds;
  }
}
