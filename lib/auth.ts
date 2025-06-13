import { createClient } from '@farcaster/quick-auth';

const quickAuthClient = createClient();

export interface AuthTokenPayload {
  sub: number;
  exp: number;
  iat: number;
  iss: string;
  aud: string;
}

export class FarcasterAuth {
  /**
   * Verify a Quick Auth token from the Farcaster SDK
   * @param authHeader The Authorization header value (including "Bearer " prefix)
   * @returns The decoded token payload if valid
   * @throws Error if token is invalid
   */
  static async verifyQuickAuthToken(
    authHeader: string
  ): Promise<AuthTokenPayload> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header format');
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      // Verify the JWT with Quick Auth
      const payload = await quickAuthClient.verifyJwt({
        token,
        domain:
          process.env.NEXT_PUBLIC_URL?.replace(/^https?:\/\//, '') ||
          'localhost:3000',
      });

      return payload as unknown as AuthTokenPayload;
    } catch (error) {
      console.error('Token verification error:', error);
      throw new Error('Invalid or expired authentication token');
    }
  }

  /**
   * Extract FID from authorization header
   * @param authHeader The Authorization header value
   * @returns The FID if valid
   */
  static async getFidFromAuth(authHeader: string): Promise<number> {
    const payload = await this.verifyQuickAuthToken(authHeader);
    const fid = payload.sub;

    if (fid <= 0) {
      throw new Error('Invalid FID in token');
    }

    return fid;
  }

  /**
   * Middleware to verify authentication
   * @param request The incoming request
   * @returns The FID if authenticated
   */
  static async requireAuth(request: Request): Promise<number> {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    return this.getFidFromAuth(authHeader);
  }
}
