'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth, type AuthState } from './auth';

interface AuthContextType extends AuthState {
  // Add any additional auth-related methods here
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuthContext();

    if (isLoading) {
      return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
            <div className="text-white/70">Loading...</div>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to home or show login prompt
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      return null;
    }

    return <Component {...props} />;
  };
}