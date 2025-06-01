export interface FarcasterFrameContext {
  user?: {
    fid?: number;
    displayName?: string;
    username?: string;
    pfpUrl?: string;
  };
  client?: {
    added?: boolean;
  };
}
