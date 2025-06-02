import { createClient } from '@supabase/supabase-js';

export type Notification = {
  id: string;
  fid: number;
  url?: string;
  token?: string;
  created_at: string;
};

// --- Types ---
export type Player = {
  id?: string; // Supabase ID, usually UUID
  created_at?: string; // Timestamp
  fid: number;
  name?: string;
  pfp?: string;
  username: string;
  url?: string;
  token?: string;
  points?: number;
};

// --- End Types ---

type Conversation = {
  id?: string;
  created_at?: string;
  thread_hash: string;
  openai_thread_id: string;
  last_updated?: string;
};

export type Coin = {
  fid: number;
  coinAddress: `0x${string}`;
  name: string;
  symbol: string;
  description: string;
  parent: string;
};

type Creators = {
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
};

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const supabaseService = {
  async upsertPlayer(
    record: Partial<Player> & Pick<Player, 'fid' | 'name' | 'pfp' | 'username'>
  ) {
    // Use standard upsert to set fid and openai_thread_id
    // Note: This will NOT increment message_count
    const { data, error } = await supabase
      .from('players')
      .upsert(record, {
        onConflict: 'fid', // Assuming 'fid' is the unique constraint
      })
      .select(); // Select the updated/inserted row

    if (error) {
      console.error('Supabase upsert error (players):', error);
      throw new Error('Failed to upsert player');
    }
    return data;
  },

  async incrementPlayerMessageCount(fid: number) {
    // Call the specific RPC function to increment the count atomically
    const { error } = await supabase.rpc('increment_message_count_by_fid', {
      p_fid: fid,
    });

    if (error) {
      console.error(
        'Supabase RPC error (increment_message_count_by_fid):',
        error
      );
      // Decide how to handle this error, maybe just log it
      // or throw new Error('Failed to increment message count');
    }
  },

  async incrementPlayerPoints(fid: number, points: number) {
    const { error } = await supabase.rpc('increment_user_points', {
      p_fid: fid,
      p_points: points,
    });

    if (error) {
      console.error('Supabase RPC error (increment_user_points):', error);
      throw new Error('Failed to increment player points');
    }
  },

  async upsertConversation(record: Conversation) {
    const { data, error } = await supabase
      .from('conversations')
      .upsert(record, {
        onConflict: 'id',
      })
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to save conversation');
    }

    return data;
  },
  async getConversationByThreadHash(threadHash: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('thread_hash', threadHash);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to get conversation');
    }

    return data;
  },
  async getPlayerByFid(fid: number) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('fid', fid);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to get player');
    }

    return data;
  },

  async updatePlayer(fid: number, player: Partial<Player>) {
    const { data, error } = await supabase
      .from('players')
      .update(player)
      .eq('fid', fid);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to update player');
    }

    return data;
  },

  async storeCoin(coin: Coin) {
    const { data, error } = await supabase.from('coins').insert(coin);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to store coin');
    }

    return data;
  },

  async getBuildById(id: string) {
    const { data, error } = await supabase
      .from('builds')
      .select('code, name, image, description, coin_address')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to get game');
    }

    return data;
  },
  async insertNotification(
    notification: Omit<Notification, 'id' | 'created_at'>
  ) {
    const { data, error } = await supabase
      .from('notifications')
      .upsert(notification, {
        onConflict: 'fid',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async getBuilds() {
    const { data, error } = await supabase.from('builds').select('*');

    if (error) {
      throw error;
    }

    return data;
  },

  async getPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('points', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  },

  async getCreatorByFID(fid: number) {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('fid', fid);

    if (error) {
      throw error;
    }

    return data;
  },

  async getCoins() {
    const { data, error } = await supabase.from('coins').select('*');

    if (error) {
      throw error;
    }

    return data;
  },

  // Add direct access to supabase client
  from: supabase.from.bind(supabase),
};
