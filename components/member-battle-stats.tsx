"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemberBattleStats } from "@/hooks/useMemberBattleStats";
import { Trophy, Target, Zap, TrendingUp } from "lucide-react";

interface MemberBattleStatsProps {
  memberId: string | number;
  memberName?: string;
  compact?: boolean;
}

export function MemberBattleStats({ memberId, memberName, compact = false }: MemberBattleStatsProps) {
  const { stats, loading, error } = useMemberBattleStats(memberId);

  if (loading) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Loading stats...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6">
          <p className="text-red-400 text-center">Failed to load stats</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Target className="w-4 h-4 text-blue-400" />
          <span className="text-gray-400">{stats.total_battles} battles</span>
        </div>
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-gray-400">{stats.won_battles} won</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-gray-400">{stats.win_percentage}%</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          {memberName ? `${memberName}'s ` : ""}Battle Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Battles */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-gray-400 uppercase">Total Battles</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total_battles}</p>
          </div>

          {/* Won Battles */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <p className="text-xs text-gray-400 uppercase">Won</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.won_battles}</p>
          </div>

          {/* Lost Battles */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-red-400" />
              <p className="text-xs text-gray-400 uppercase">Lost</p>
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.lost_battles}</p>
          </div>

          {/* Win Percentage */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <p className="text-xs text-gray-400 uppercase">Win Rate</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-white">{stats.win_percentage}%</p>
              {stats.win_percentage >= 50 ? (
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Good</Badge>
              ) : (
                <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Fair</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Active Battles */}
        {stats.active_battles > 0 && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-400">
              {stats.active_battles} active battle{stats.active_battles > 1 ? "s" : ""} in progress
            </p>
          </div>
        )}

        {/* Progress Bar */}
        {stats.total_battles > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Win/Loss Ratio</span>
              <span>
                {stats.won_battles}W - {stats.lost_battles}L
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div className="h-full flex">
                <div className="bg-linear-to-r from-green-500 to-green-600 transition-all duration-500" style={{ width: `${(stats.won_battles / (stats.won_battles + stats.lost_battles)) * 100}%` }} />
                <div className="bg-linear-to-r from-red-500 to-red-600 transition-all duration-500" style={{ width: `${(stats.lost_battles / (stats.won_battles + stats.lost_battles)) * 100}%` }} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
