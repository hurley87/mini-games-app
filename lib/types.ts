export interface Build {
  id: string;
  name: string;
  description: string;
  image: string;
  coin_address: string;
  fid: number;
  created_at: string;
  html: string;
}

export interface Coin {
  id: string;
  fid: number;
  coin_address: string;
  name: string;
  symbol: string;
  description: string;
  parent: string;
  build_id: string;
  created_at: string;
  updated_at: string;
  image: string;
  duration?: number;
  token_multiplier: number;
  premium_threshold: number;
  max_points: number;
}

// Zora-specific coin data types
export interface ZoraCoinData {
  volume24h?: string;
  marketCap?: string;
  uniqueHolders?: number;
}

export interface Creator {
  fid: number;
  bio: string;
  username: string;
  pfp: string;
  created_at: string;
  updated_at: string;
  score: number;
  primary_address: string;
  follower_count: number;
  following_count: number;
  power_badge: boolean;
}

export interface BuildWithCreator extends Build {
  creator?: Creator;
}

export interface CoinWithCreator extends Coin {
  creator?: Creator;
  zoraData?: ZoraCoinData;
}
