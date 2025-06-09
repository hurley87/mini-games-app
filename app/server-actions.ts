'use server';

import { supabaseService } from '@/lib/supabase';

export type PlayerData = {
  fid: number;
  name: string;
  pfp: string;
  username: string;
  wallet_address: string;
};

/**
 * Upserts player data and awards referral points if needed.
 * @param player Player information to upsert
 * @param sharerFid optional referring fid
 */
export async function savePlayerAndReferral(
  player: PlayerData,
  sharerFid: number | null
) {
  const { isNew } = await supabaseService.upsertPlayerWithNewFlag(player);

  if (isNew && sharerFid && sharerFid !== player.fid) {
    const sharer = await supabaseService.getPlayerByFid(sharerFid);
    if (sharer && sharer.length > 0) {
      await supabaseService.incrementPlayerPoints(sharerFid, 5);
    }
  }
}
