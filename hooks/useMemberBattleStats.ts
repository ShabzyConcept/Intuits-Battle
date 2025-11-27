import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export interface BattleStats {
  total_battles: number;
  won_battles: number;
  lost_battles: number;
  active_battles: number;
  currently_winning: number;
  win_percentage: number;
}

export function useMemberBattleStats(memberId: string | number | null) {
  const [stats, setStats] = useState<BattleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) {
      setStats({
        total_battles: 0,
        won_battles: 0,
        lost_battles: 0,
        active_battles: 0,
        currently_winning: 0,
        win_percentage: 0,
      });
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabaseBrowser.rpc("get_member_battle_stats", {
          member_id_param: parseInt(String(memberId)),
        });

        if (fetchError) {
          console.error("RPC Error:", fetchError);
          setStats({
            total_battles: 0,
            won_battles: 0,
            lost_battles: 0,
            active_battles: 0,
            currently_winning: 0,
            win_percentage: 0,
          });
          return;
        }

        if (data && data.length > 0) {
          setStats(data[0]);
        } else {
          setStats({
            total_battles: 0,
            won_battles: 0,
            lost_battles: 0,
            active_battles: 0,
            currently_winning: 0,
            win_percentage: 0,
          });
        }
      } catch (err) {
        console.error("Error fetching battle stats:", err);
        setError("Failed to load battle statistics");
        // Return zeros instead of null
        setStats({
          total_battles: 0,
          won_battles: 0,
          lost_battles: 0,
          active_battles: 0,
          currently_winning: 0,
          win_percentage: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [memberId]);

  return { stats, loading, error };
}

export async function getMemberBattleStats(memberId: string | number): Promise<BattleStats | null> {
  try {
    const { data, error } = await supabaseBrowser.rpc("get_member_battle_stats", {
      member_id_param: parseInt(String(memberId)),
    });

    if (error) throw error;

    if (data && data.length > 0) {
      return data[0];
    }

    return {
      total_battles: 0,
      won_battles: 0,
      lost_battles: 0,
      active_battles: 0,
      currently_winning: 0,
      win_percentage: 0,
    };
  } catch (error) {
    console.error("Error fetching battle stats:", error);
    return null;
  }
}
