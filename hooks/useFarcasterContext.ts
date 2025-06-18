import { useFarcasterContext as useProviderContext } from '@/app/components/farcaster-provider';

interface UseFarcasterContextOptions {
  /**
   * Whether to disable native gestures for gaming frames
   * @deprecated This option is now handled at the provider level. 
   * Use the actions.ready() method for component-specific ready calls.
   */
  disableNativeGestures?: boolean;
  /**
   * Whether to automatically try to add the frame
   * @deprecated This option is now handled at the provider level
   */
  autoAddFrame?: boolean;
}

/**
 * @deprecated Use the FarcasterProvider and useFarcasterContext from @/app/components/farcaster-provider instead.
 * This hook is kept for backward compatibility.
 */
export function useFarcasterContext(options: UseFarcasterContextOptions = {}) {
  const providerContext = useProviderContext();
  
  // If disableNativeGestures is true, we need to call ready again with this option
  // This is a temporary solution for the Game component
  if (options.disableNativeGestures && providerContext.isReady) {
    // Call ready with disableNativeGestures once when the component mounts
    // This is handled in the Game component itself now
  }

  return {
    context: providerContext.context,
    isReady: providerContext.isReady,
    isLoading: providerContext.isLoading,
  };
}
