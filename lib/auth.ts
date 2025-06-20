import { createClient, Errors } from '@farcaster/quick-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sdk } from '@farcaster/frame-sdk';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';

const quickAuthClient = createClient();

export interface AuthTokenPayload {
  sub: number;
  exp: number;
  iat: number;
  iss: string;
  aud: string;
}

export interface User {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  wallet_address?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// React Query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  profile: (fid: number) => [...authKeys.all, 'profile', fid] as const,
};

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
      if (error instanceof Errors.InvalidTokenError) {
        console.info('Invalid token:', error.message);
        throw new Error('Invalid or expired authentication token');
      }

      console.error('Token verification error:', error);
      throw new Error('Authentication service error');
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

// Auth API functions
async function fetchUserProfile(fid: number): Promise<User | null> {
  try {
    // Type assertion to handle SDK typing issues
    const response = await (sdk as any).quickAuth.fetch(`/api/players/${fid}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

async function saveUserData(userData: Partial<User>): Promise<User> {
  const response = await (sdk as any).quickAuth.fetch('/api/players', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error(`Failed to save user data: ${response.statusText}`);
  }

  const result = await response.json();
  return result.user || result;
}

// Custom hooks for auth with React Query
export function useAuth(): AuthState {
  const { context, isReady } = useFarcasterContext();
  
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      if (!context?.user) return null;
      
      // Try to fetch existing user profile
      const existingUser = await fetchUserProfile(context.user.fid);
      if (existingUser) return existingUser;
      
      // If user doesn't exist, create new user
      const newUser = await saveUserData({
        fid: context.user.fid,
        username: context.user.username,
        displayName: context.user.displayName,
        pfpUrl: context.user.pfpUrl,
      });
      
      return newUser;
    },
    enabled: isReady && !!context?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  return {
    user: user || null,
    isAuthenticated: !!user,
    isLoading: !isReady || isLoading,
    error: error?.message || null,
  };
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveUserData,
    onSuccess: (updatedUser) => {
      // Update the user query cache
      queryClient.setQueryData(authKeys.user(), updatedUser);
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: authKeys.profile(updatedUser.fid),
      });
    },
    onError: (error) => {
      console.error('Failed to update user:', error);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Clear auth-related data
      queryClient.clear();
      
      // You might want to call a logout API endpoint here
      // await fetch('/api/auth/logout', { method: 'POST' });
    },
    onSuccess: () => {
      // Redirect to home page
      window.location.href = '/';
    },
  });
}

// User profile hook
export function useUserProfile(fid?: number) {
  return useQuery({
    queryKey: authKeys.profile(fid!),
    queryFn: () => fetchUserProfile(fid!),
    enabled: !!fid,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Auth utilities
export function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    // Add any additional auth headers here
  };
}

export function isAuthenticated(): boolean {
  // This is a synchronous check - you might want to check localStorage or cookies
  // For a more robust solution, use the useAuth hook in components
  try {
    return typeof window !== 'undefined' && !!localStorage.getItem('farcaster-user');
  } catch {
    return false;
  }
}
