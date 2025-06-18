'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { FarcasterFrameContext } from '@/lib/types/farcaster';

interface FarcasterContextValue {
  context: FarcasterFrameContext | null;
  isReady: boolean;
  isLoading: boolean;
  actions: {
    addFrame: () => Promise<void>;
    ready: (options?: { disableNativeGestures?: boolean }) => Promise<void>;
  };
}

interface FarcasterProviderProps {
  children: ReactNode;
  /**
   * Whether to disable native gestures for gaming frames
   */
  disableNativeGestures?: boolean;
  /**
   * Whether to automatically try to add the frame
   */
  autoAddFrame?: boolean;
}

const FarcasterContext = createContext<FarcasterContextValue | null>(null);

export function FarcasterProvider({ 
  children, 
  disableNativeGestures = false,
  autoAddFrame = false 
}: FarcasterProviderProps) {
  const [context, setContext] = useState<FarcasterFrameContext | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize frame once when provider mounts
  useEffect(() => {
    const initializeFrame = async () => {
      try {
        // Get context from SDK
        const frameContext = await sdk.context;
        setContext(frameContext);

        // Mark frame as ready
        await sdk.actions.ready({
          disableNativeGestures,
        });
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize frame:', error);
        try {
          await sdk.actions.ready({
            disableNativeGestures,
          });
        } catch (readyError) {
          console.error(
            'Failed to signal ready after init failure:',
            readyError
          );
        }
        setIsReady(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeFrame();
  }, [disableNativeGestures]);

  // Handle auto-add frame
  useEffect(() => {
    const handleAddFrame = async () => {
      if (context && autoAddFrame && !context.client?.added) {
        try {
          await sdk.actions.addFrame();
        } catch (error) {
          console.error('Failed to add frame:', error);
        }
      }
    };

    handleAddFrame();
  }, [context, autoAddFrame]);

  // Expose actions for components that need specific functionality
  const actions = {
    addFrame: async () => {
      try {
        await sdk.actions.addFrame();
      } catch (error) {
        console.error('Failed to add frame:', error);
        throw error;
      }
    },
    ready: async (options?: { disableNativeGestures?: boolean }) => {
      try {
        await sdk.actions.ready(options);
      } catch (error) {
        console.error('Failed to signal ready:', error);
        throw error;
      }
    },
  };

  const value: FarcasterContextValue = {
    context,
    isReady,
    isLoading,
    actions,
  };

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcasterContext() {
  const context = useContext(FarcasterContext);
  
  if (!context) {
    throw new Error('useFarcasterContext must be used within a FarcasterProvider');
  }
  
  return context;
}