'use client';

import { useAuthContext } from '@/lib/auth-context';
import { useLogout } from '@/lib/auth';

export function AuthStatus() {
  const { user, isAuthenticated, isLoading, error } = useAuthContext();
  const logoutMutation = useLogout();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span className="text-sm text-white/70">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm">
        Auth Error: {error}
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="text-white/70 text-sm">
        Not authenticated
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <img 
          src={user.pfpUrl} 
          alt={user.displayName}
          className="w-8 h-8 rounded-full"
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">
            {user.displayName}
          </span>
          <span className="text-xs text-white/70">
            @{user.username}
          </span>
        </div>
      </div>
      
      <button
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded border border-white/20 disabled:opacity-50"
      >
        {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}