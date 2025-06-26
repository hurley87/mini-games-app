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
  build_id: string;
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
    if (!record.wallet_address) {
      console.warn(
        'Skipping player upsert because wallet address is null or undefined'
      );
      return null;
    }
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
    if (!record.wallet_address) {
      console.warn(
        'Skipping upsertPlayerWithNewFlag because wallet address is null or undefined'
      );
      return { data: null, isNew: false };
    }
    try {
      // Use atomic upsert with RPC function to avoid race conditions
      // Pass parameters in the correct order as expected by the database function
      const { data, error } = await supabase.rpc(
        'upsert_player_with_new_flag',
        {
          p_fid: record.fid,
          p_name: record.name,
          p_pfp: record.pfp,
          p_points: record.points || 0,
          p_token: record.token || null,
          p_url: record.url || null,
          p_username: record.username,
          p_wallet_address: record.wallet_address,
        }
      );

      if (error) {
        console.error(
          'Supabase RPC error (upsert_player_with_new_flag):',
          error
        );
        // If RPC function fails, fall back to checking existence and then upserting
        return await this.upsertPlayerWithFallback(record);
      }

      return {
        data: data?.player || null,
        isNew: data?.is_new || false,
      };
    } catch (error) {
      console.error('Error in upsertPlayerWithNewFlag, using fallback:', error);
      return await this.upsertPlayerWithFallback(record);
    }
  },

  async upsertPlayerWithFallback(
    record: Partial<Player> &
      Pick<Player, 'fid' | 'name' | 'pfp' | 'username' | 'wallet_address'>
  ): Promise<{ data: Player | null; isNew: boolean }> {
    if (!record.wallet_address) {
      console.warn(
        'Skipping upsertPlayerWithFallback because wallet address is null or undefined'
      );
      return { data: null, isNew: false };
    }
    // Check if player exists first
    const existingPlayers = await this.getPlayerByFid(record.fid);
    const isNew = !existingPlayers || existingPlayers.length === 0;

    // Upsert the player
    const upsertedData = await this.upsertPlayer(record);

    return {
      data: upsertedData?.[0] || null,
      isNew,
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

  async recordGamePlay(gamePlay: Omit<GamePlay, 'id'>) {
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

  async getGamePlayRecord(fid: number, gameId: string) {
    const { data, error } = await supabase
      .from('game_plays')
      .select('*')
      .eq('fid', fid)
      .eq('game_id', gameId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting game play record:', error);
      throw new Error('Failed to get game play record');
    }

    return data as GamePlay | null;
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

  async getAllNotifications() {
    const { data, error } = await supabase.from('notifications').select('*');

    if (error) {
      console.error('Error getting all notifications:', error);
      throw new Error('Failed to get all notifications');
    }

    return data || [];
  },

  async getAllGamePlayRecords() {
    const { data, error } = await supabase.from('game_plays').select('*');

    if (error) {
      console.error('Error getting all game play records:', error);
      throw new Error('Failed to get all game play records');
    }

    return data || [];
  },

  async getDailyStreak(fid: number) {
    const { data, error } = await supabase
      .from('daily_streaks')
      .select('streak, last_claimed')
      .eq('fid', fid)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting daily streak:', error);
      throw new Error('Failed to get daily streak');
    }

    if (!data) return null;

    const today = new Date().toISOString().split('T')[0];
    return {
      streak: data.streak as number,
      claimed: data.last_claimed === today,
    };
  },

  async recordDailyLogin(fid: number) {
    const today = new Date().toISOString().split('T')[0];

    try {
      // First, try to get existing record
      const { data: row, error } = await supabase
        .from('daily_streaks')
        .select('last_login, streak, last_claimed')
        .eq('fid', fid)
        .maybeSingle(); // Use maybeSingle to avoid throwing on no results

      if (error) {
        console.error('Error fetching daily streak:', error);
        throw new Error('Failed to get daily streak');
      }

      if (!row) {
        // No existing record, try to insert
        try {
          const { data, error: insertError } = await supabase
            .from('daily_streaks')
            .insert({ fid, streak: 1, last_login: today })
            .select('streak, last_claimed')
            .single();

          if (insertError) {
            // If we get a unique constraint violation, it means another request
            // created the record between our SELECT and INSERT
            if (insertError.code === '23505') {
              // Retry by fetching the now-existing record
              const { data: retryRow, error: retryError } = await supabase
                .from('daily_streaks')
                .select('last_login, streak, last_claimed')
                .eq('fid', fid)
                .single();

              if (retryError) {
                console.error(
                  'Error fetching daily streak on retry:',
                  retryError
                );
                throw new Error('Failed to get daily streak');
              }

              // Process the existing record that was created by another request
              return supabaseService.processExistingStreak(
                retryRow,
                fid,
                today
              );
            }

            console.error('Error inserting daily streak:', insertError);
            throw new Error('Failed to record daily login');
          }

          return { streak: data.streak as number, claimed: false };
        } catch (insertErr) {
          console.error('Insert error:', insertErr);
          throw insertErr;
        }
      }

      // Process existing record
      return supabaseService.processExistingStreak(row, fid, today);
    } catch (error) {
      console.error('Error in recordDailyLogin:', error);
      throw error;
    }
  },

  async processExistingStreak(
    row: {
      last_login: string | null;
      streak: number;
      last_claimed: string | null;
    },
    fid: number,
    today: string
  ) {
    let newStreak = row.streak as number;
    const lastLogin = row.last_login as string | null;

    // Always calculate streak properly, including when last_login is null
    if (lastLogin) {
      const diff =
        (new Date(today).getTime() - new Date(lastLogin).getTime()) /
        (1000 * 60 * 60 * 24);
      if (diff >= 1 && diff < 2) {
        newStreak = row.streak + 1;
      } else if (diff >= 2) {
        newStreak = 1;
      }
      // If diff < 1 (same day), keep current streak and don't update last_login
      if (diff < 1) {
        return {
          streak: row.streak as number,
          claimed: row.last_claimed === today,
        };
      }
    } else {
      // Handle null last_login by resetting streak to 1
      newStreak = 1;
    }

    const { data: updatedData, error: updateError } = await supabase
      .from('daily_streaks')
      .update({ streak: newStreak, last_login: today })
      .eq('fid', fid)
      .select('streak, last_claimed')
      .single();

    if (updateError) {
      console.error('Error updating daily streak:', updateError);
      throw new Error('Failed to record daily login');
    }

    return {
      streak: updatedData.streak as number,
      claimed: updatedData.last_claimed === today,
    };
  },

  async claimDailyStreak(fid: number) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_streaks')
      .update({ last_claimed: today })
      .eq('fid', fid)
      .select('streak, last_claimed');

    if (error) {
      console.error('Error claiming daily streak:', error);
      throw new Error('Failed to claim daily streak');
    }

    if (!data || data.length === 0) {
      throw new Error('No daily streak record found');
    }

    // Handle multiple rows case by using the first one
    // This shouldn't happen ideally, but we handle it gracefully
    const streakData = Array.isArray(data) ? data[0] : data;

    return { streak: streakData.streak as number, claimed: true };
  },

  // Add direct access to supabase client
  from: supabase.from.bind(supabase),
};
