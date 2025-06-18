import { sdk } from '@farcaster/frame-sdk';
import { useEffect, useState } from 'react';
import { FarcasterFrameContext } from '@/lib/types/farcaster';

interface UseFarcasterContextOptions {
  /**
   * Whether to disable native gestures for gaming frames
   */
  disableNativeGestures?: boolean;
  /**
   * Whether to automatically try to add the frame
   */
  autoAddFrame?: boolean;
}

export function useFarcasterContext(options: UseFarcasterContextOptions = {}) {
  const [context, setContext] = useState<FarcasterFrameContext | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeFrame = async () => {
      try {
        // Get context from SDK
        const frameContext = await sdk.context;
        setContext(frameContext);

        // Mark frame as ready
        await sdk.actions.ready({
          disableNativeGestures: options.disableNativeGestures,
        });
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize frame:', error);
        try {
          await sdk.actions.ready({
            disableNativeGestures: options.disableNativeGestures,
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
  }, [options.disableNativeGestures]);

  useEffect(() => {
    const handleAddFrame = async () => {
      if (context && options.autoAddFrame && !context.client?.added) {
        try {
          await sdk.actions.addFrame();
        } catch (error) {
          console.error('Failed to add frame:', error);
        }
      }
    };

    handleAddFrame();
  }, [context, options.autoAddFrame]);

  return {
    context,
    isReady,
    isLoading,
  };
}
