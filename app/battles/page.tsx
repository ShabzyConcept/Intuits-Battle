"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { BattleCard } from "@/components/battle-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Battle } from "@/types/database";

export default function BattlesPage() {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(() => {
    fetchBattles();
  }, []);

  async function fetchBattles() {
    try {
      setLoading(true);
      setError(null);

      // Fetch battles with member data using explicit joins
      const { data: battlesData, error: battlesError } = await supabase
        .from("battles")
        .select(
          `
    *,
    member1:community_members!battles_member1_id_fkey (*),
    member2:community_members!battles_member2_id_fkey (*)
  `
        )
        .order("created_at", { ascending: false });

      if (battlesError) throw battlesError;

      const transformedBattles: Battle[] = (battlesData || []).map((battle: any) => ({
        id: String(battle.id),
        title: battle.title,
        description: battle.description,
        member_a_id: String(battle.member1_id),
        member_b_id: String(battle.member2_id),
        member_a: battle.member1 ? mapToCommunityMember(battle.member1) : undefined,
        member_b: battle.member2 ? mapToCommunityMember(battle.member2) : undefined,
        votes_a: battle.member1_votes || 0,
        votes_b: battle.member2_votes || 0,
        status: battle.is_active ? "active" : "completed",
        start_time: battle.start_date || battle.created_at,
        end_time: battle.end_date,
        winner_id: null,
        created_by: null,
        created_at: battle.created_at,
        updated_at: battle.updated_at,
      }));

      setBattles(transformedBattles);
    } catch (err) {
      console.error("Error fetching battles:", err);
      setError("Failed to load battles");
    } finally {
      setLoading(false);
    }
  }

  function mapToCommunityMember(member: any) {
    return {
      atomid: member.atomid || member.id,
      name: member.name,
      description: member.description || "",
      image: member.image || member.avatar_url || "",
      category: member.category || "",
      avatar_url: member.avatar_url || "",
      total_votes: member.total_votes || 0,
      upvotes: member.upvotes || 0,
      downvotes: member.downvotes || 0,
      is_active: member.is_active ?? true,
      created_at: member.created_at || new Date().toISOString(),
      updated_at: member.updated_at || new Date().toISOString(),
    };
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">Intuit 👁️ Battle</h1>
                <p className="text-gray-400 mt-1">Watch epic battles between community members</p>
              </div>
            </div>
            <Link href="/battles/create">
              <Button className="bg-blue-600 hover:bg-blue-700">Create Battle</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading battles...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
            <Button onClick={fetchBattles} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : battles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No battles yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {battles.map((battle) => (
              <BattleCard key={battle.id} battle={battle} showVoteButtons={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
