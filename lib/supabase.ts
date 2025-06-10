import { createClient } from '@supabase/supabase-js';

// Helper function to validate UUID format
function isValidUUID(uuid: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

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
  wallet_address: string;
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

export type GamePlay = {
  id?: string;
  created_at?: string;
  fid: number;
  game_id: string;
  coin_address: string;
};

export type PlayerRank = {
  fid: number;
  username: string;
  name?: string;
  pfp?: string;
  points: number;
  rank: number;
};

type ScoreRow = {
  fid: number;
  score: number;
};

type PlayerStats = {
  fid: number;
  total_score: number;
  play_count: number;
};

type PlayerInfo = {
  fid: number;
  username: string;
  name?: string;
  pfp?: string;
};

type LeaderboardEntry = PlayerInfo &
  PlayerStats & {
    rank: number;
  };

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const supabaseService = {
  async upsertPlayer(
    record: Partial<Player> &
      Pick<Player, 'fid' | 'name' | 'pfp' | 'username' | 'wallet_address'>
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

  async upsertPlayerWithNewFlag(
    record: Partial<Player> &
      Pick<Player, 'fid' | 'name' | 'pfp' | 'username' | 'wallet_address'>
  ): Promise<{ data: Player | null; isNew: boolean }> {
    // Use atomic upsert with RPC function to avoid race conditions
    // Build params without points by default to avoid overwriting existing value
    const params: Record<string, unknown> = {
      p_fid: record.fid,
      p_name: record.name,
      p_pfp: record.pfp,
      p_username: record.username,
      p_wallet_address: record.wallet_address,
      p_url: record.url || null,
      p_token: record.token || null,
    };

    if (record.points !== undefined) {
      params.p_points = record.points;
    } else {
      // Attempt to preserve existing points, but handle errors gracefully
      const { data: existing, error: existingError } = await supabase
        .from('players')
        .select('points')
        .eq('fid', record.fid)
        .single();

      if (!existingError && existing && typeof existing.points === 'number') {
        // Only preserve points if they exist and are a valid number
        params.p_points = existing.points;
      } else if (existingError && existingError.code !== 'PGRST116') {
        // If there's a database error (not "player not found"), log but don't fail
        // PGRST116 is "not found" error, which is expected for new players
        console.warn(
          'Could not fetch existing points for player:',
          existingError
        );
        params.p_points = 0; // Default to 0 for safety
      } else {
        // New player or existing player with null/undefined points
        params.p_points = 0;
      }
    }

    const { data, error } = await supabase.rpc(
      'upsert_player_with_new_flag',
      params
    );

    if (error) {
      console.error('Supabase RPC error (upsert_player_with_new_flag):', error);
      throw new Error('Failed to upsert player with new flag');
    }

    return {
      data: data?.player || null,
      isNew: data?.is_new || false,
    };
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
    const { error } = await supabase.rpc('increment_player_points', {
      player_id_param: fid,
      points_to_add: points,
    });

    if (error) {
      console.error('Supabase RPC error (increment_player_points):', error);
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
      .select('title, image, description, html, tutorial')
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

  async getCoinById(id: string) {
    const { data, error } = await supabase
      .from('coins')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async recordGamePlay(gamePlay: Omit<GamePlay, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('game_plays')
      .upsert(gamePlay, {
        onConflict: 'fid,game_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording game play:', error);
      throw new Error('Failed to record game play');
    }

    return data;
  },

  async hasPlayerPlayedGame(fid: number, gameId: string) {
    const { data, error } = await supabase
      .from('game_plays')
      .select('id')
      .eq('fid', fid)
      .eq('game_id', gameId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected when player hasn't played
      console.error('Error checking game play:', error);
      throw new Error('Failed to check game play status');
    }

    return !!data;
  },

  async getPlayerGamePlays(fid: number) {
    const { data, error } = await supabase
      .from('game_plays')
      .select('*')
      .eq('fid', fid);

    if (error) {
      console.error('Error getting player game plays:', error);
      throw new Error('Failed to get player game plays');
    }

    return data || [];
  },

  async getPlayerRankByFid(fid: number) {
    const { data, error } = await supabase.rpc('get_player_rank_by_fid', {
      player_fid: fid,
    });

    if (error) {
      console.error('Error getting player rank:', error);
      throw new Error('Failed to get player rank');
    }

    return data?.[0] || null;
  },

  async getPlayerLeaderboard() {
    const { data, error } = await supabase.rpc('get_player_leaderboard');

    if (error) {
      console.error('Error getting leaderboard:', error);
      throw new Error('Failed to get leaderboard');
    }

    return data || [];
  },

  async getCoinLeaderboard(coinId: string, limit?: number) {
    try {
      // Validate UUID format
      if (!coinId || !isValidUUID(coinId)) {
        throw new Error('Invalid coin ID format');
      }

      // Use direct query method instead of RPC due to UUID/text type casting issues
      return await this.getCoinLeaderboardFallback(coinId, limit);
    } catch (error) {
      console.error('Error in getCoinLeaderboard:', error);
      throw error;
    }
  },

  async getCoinLeaderboardFallback(coinId: string, limit?: number) {
    try {
      // Get all scores for this coin first
      const { data: scores, error: scoresError } = await supabase
        .from('scores')
        .select('fid, score')
        .eq('coin_id', coinId);

      if (scoresError) {
        console.error('Error fetching scores:', scoresError);
        throw new Error('Failed to get coin scores');
      }

      if (!scores || scores.length === 0) {
        return [];
      }

      // Aggregate scores by player FID
      const playerStats = new Map<number, PlayerStats>();

      scores.forEach((scoreRow: ScoreRow) => {
        const fid = scoreRow.fid;
        const existing = playerStats.get(fid) || {
          fid,
          total_score: 0,
          play_count: 0,
        };

        existing.total_score += scoreRow.score || 0;
        existing.play_count += 1;
        playerStats.set(fid, existing);
      });

      // Get unique FIDs
      const uniqueFids = Array.from(playerStats.keys());

      // Fetch player information for all unique FIDs
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('fid, username, name, pfp')
        .in('fid', uniqueFids);

      if (playersError) {
        console.error('Error fetching players:', playersError);
        throw new Error('Failed to get player information');
      }

      // Create a map of player info by FID
      const playerInfoMap = new Map<number, PlayerInfo>();
      players?.forEach((player: PlayerInfo) => {
        playerInfoMap.set(player.fid, player);
      });

      // Combine stats with player info
      const leaderboard: LeaderboardEntry[] = Array.from(playerStats.values())
        .map((stats) => {
          const playerInfo = playerInfoMap.get(stats.fid);
          return {
            fid: stats.fid,
            username: playerInfo?.username || `User ${stats.fid}`,
            name: playerInfo?.name,
            pfp: playerInfo?.pfp,
            total_score: stats.total_score,
            play_count: stats.play_count,
          };
        })
        .sort((a, b) => b.total_score - a.total_score)
        .map((player, index) => ({
          ...player,
          rank: index + 1,
        }));

      // Apply limit if specified
      return limit ? leaderboard.slice(0, limit) : leaderboard;
    } catch (error) {
      console.error('Error in getCoinLeaderboardFallback:', error);
      throw error;
    }
  },

  async getPendingScoresGroupedByToken() {
    const { data, error } = await supabase.rpc(
      'get_pending_scores_grouped_by_token'
    );

    if (error) {
      console.error('Error getting pending scores grouped by token:', error);
      throw new Error('Failed to get pending scores grouped by token');
    }

    return data || [];
  },

  async getNotificationByFid(fid: number) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('fid', fid);

    if (error) {
      console.error('Error getting notifications by fid:', error);
      throw new Error('Failed to get notifications by fid');
    }

    return data || [];
  },

  // Add direct access to supabase client
  from: supabase.from.bind(supabase),
};
