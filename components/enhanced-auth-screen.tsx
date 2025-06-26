'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { LoadingSpinner } from './ui/loading-spinner';
import { useMiniApp } from '@/contexts/miniapp-context';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useSignIn } from '@/hooks/use-sign-in';
import { CheckCircle, XCircle, AlertCircle, Wallet, Smartphone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AuthStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  action?: () => void;
  actionLabel?: string;
  errorMessage?: string;
}

interface EnhancedAuthScreenProps {
  onAuthSuccess?: () => void;
  showSteps?: boolean;
}

export function EnhancedAuthScreen({ 
  onAuthSuccess, 
  showSteps = true 
}: EnhancedAuthScreenProps) {
  const { context, isMiniAppReady } = useMiniApp();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signIn, isLoading: isSigningIn, error: signInError, user } = useSignIn({
    autoSignIn: false,
  });

  const [manualRetryCount, setManualRetryCount] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  // Authentication steps
  const [steps, setSteps] = useState<AuthStep[]>([
    {
      id: 'miniapp',
      title: 'Farcaster MiniApp',
      description: 'Initialize Farcaster MiniApp connection',
      status: 'pending',
    },
    {
      id: 'wallet',
      title: 'Connect Wallet',
      description: 'Connect your wallet to verify token ownership',
      status: 'pending',
      action: () => handleConnectWallet(),
      actionLabel: 'Connect Wallet',
    },
    {
      id: 'farcaster',
      title: 'Farcaster Sign In',
      description: 'Authenticate with your Farcaster account',
      status: 'pending',
      action: () => handleFarcasterSignIn(),
      actionLabel: 'Sign In',
    },
  ]);

  // Update step statuses based on current state
  useEffect(() => {
    setSteps(prev => prev.map(step => {
      switch (step.id) {
        case 'miniapp':
          if (!isMiniAppReady) {
            return { ...step, status: 'loading' as const };
          } else if (context?.user?.fid) {
            return { ...step, status: 'success' as const };
          } else {
            return { 
              ...step, 
              status: 'error' as const,
              errorMessage: 'MiniApp ready but no user context found'
            };
          }
        
        case 'wallet':
          if (isConnecting) {
            return { ...step, status: 'loading' as const };
          } else if (isConnected && address) {
            return { ...step, status: 'success' as const };
          } else {
            return { 
              ...step, 
              status: 'pending' as const,
              action: () => handleConnectWallet(),
              actionLabel: 'Connect Wallet'
            };
          }
        
        case 'farcaster':
          if (isSigningIn) {
            return { ...step, status: 'loading' as const };
          } else if (user) {
            return { ...step, status: 'success' as const };
          } else if (signInError) {
            return { 
              ...step, 
              status: 'error' as const,
              errorMessage: signInError,
              action: () => handleFarcasterSignIn(),
              actionLabel: 'Retry Sign In'
            };
          } else if (isConnected && context?.user?.fid) {
            return { 
              ...step, 
              status: 'pending' as const,
              action: () => handleFarcasterSignIn(),
              actionLabel: 'Sign In'
            };
          } else {
            return { ...step, status: 'pending' as const };
          }
        
        default:
          return step;
      }
    }));
  }, [
    isMiniAppReady,
    context,
    isConnected,
    address,
    isConnecting,
    user,
    isSigningIn,
    signInError,
  ]);

  // Check if all steps are complete
  const allStepsComplete = steps.every(step => step.status === 'success');

  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      if (connectors && connectors.length > 0) {
        connect({ connector: connectors[0] });
      } else {
        toast.error('No wallet connectors available');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet');
    }
  };

  // Handle Farcaster sign in
  const handleFarcasterSignIn = async () => {
    try {
      await signIn();
      toast.success('Successfully signed in!');
    } catch (error) {
      console.error('Sign in failed:', error);
      toast.error('Sign in failed. Please try again.');
    }
  };

  // Handle disconnecting wallet (for retry)
  const handleDisconnectWallet = () => {
    disconnect();
    setManualRetryCount(prev => prev + 1);
  };

  // Check authentication status manually
  const handleCheckAuth = async () => {
    setIsCheckingAuth(true);
    try {
      // Try to fetch user data to verify auth
      const response = await fetch('/api/users/me', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        toast.success('Authentication verified!');
        onAuthSuccess?.();
      } else {
        toast.error('Authentication check failed');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      toast.error('Failed to verify authentication');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Auto-trigger onAuthSuccess when all steps complete
  useEffect(() => {
    if (allStepsComplete && user) {
      onAuthSuccess?.();
    }
  }, [allStepsComplete, user, onAuthSuccess]);

  const getStepIcon = (status: AuthStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'loading':
        return <LoadingSpinner className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepStyles = (status: AuthStep['status']) => {
    const baseStyles = 'p-4 rounded-lg border transition-all duration-200';
    switch (status) {
      case 'success':
        return `${baseStyles} bg-green-900/20 border-green-700/30`;
      case 'error':
        return `${baseStyles} bg-red-900/20 border-red-700/30`;
      case 'loading':
        return `${baseStyles} bg-blue-900/20 border-blue-700/30`;
      default:
        return `${baseStyles} bg-gray-900/20 border-gray-700/30`;
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-black/20 backdrop-blur rounded-2xl shadow-xl p-8 max-w-md w-full border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Connect to Mini Games
          </h1>
          <p className="text-white/70">
            {allStepsComplete 
              ? 'All set! You can now play games.' 
              : 'Complete the steps below to start playing'
            }
          </p>
        </div>

        {showSteps && (
          <div className="space-y-4 mb-6">
            {steps.map((step, index) => (
              <div key={step.id} className={getStepStyles(step.status)}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">
                        {step.title}
                      </h3>
                                             {step.action && (step.status === 'pending' || step.status === 'error') && (
                         <Button
                           onClick={step.action}
                           size="sm"
                           className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                         >
                           {step.actionLabel}
                         </Button>
                       )}
                    </div>
                    <p className="text-xs text-white/70 mt-1">
                      {step.description}
                    </p>
                    {step.errorMessage && (
                      <p className="text-xs text-red-300 mt-1">
                        {step.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {allStepsComplete ? (
            <Button
              onClick={handleCheckAuth}
              disabled={isCheckingAuth}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isCheckingAuth ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </Button>
          ) : (
            <>
              {!context?.user?.fid && (
                <div className="text-center text-white/60 text-sm">
                  <p>Make sure you're accessing this from within Farcaster</p>
                </div>
              )}
              
              {context?.user?.fid && !isConnected && (
                <Button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isConnecting ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </>
                  )}
                </Button>
              )}
              
              {isConnected && context?.user?.fid && !user && (
                <Button
                  onClick={handleFarcasterSignIn}
                  disabled={isSigningIn}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isSigningIn ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In with Farcaster'
                  )}
                </Button>
              )}
            </>
          )}

          {/* Troubleshooting options */}
          {(signInError || manualRetryCount > 0) && (
            <div className="border-t border-white/20 pt-4 mt-4">
              <p className="text-xs text-white/60 mb-3 text-center">
                Having trouble? Try these options:
              </p>
              <div className="space-y-2">
                {isConnected && (
                  <Button
                    onClick={handleDisconnectWallet}
                    variant="outline"
                    size="sm"
                    className="w-full text-white/70 border-white/20"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Disconnect & Retry
                  </Button>
                )}
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="w-full text-white/70 border-white/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg text-xs text-white/60">
            <p><strong>Debug Info:</strong></p>
            <p>MiniApp Ready: {isMiniAppReady ? 'Yes' : 'No'}</p>
            <p>Has Context: {context ? 'Yes' : 'No'}</p>
            <p>FID: {context?.user?.fid || 'None'}</p>
            <p>Wallet Connected: {isConnected ? 'Yes' : 'No'}</p>
            <p>Address: {address || 'None'}</p>
            <p>User Signed In: {user ? 'Yes' : 'No'}</p>
            {signInError && <p>Sign In Error: {signInError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}