"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CommunityMemberRes } from "@/types/database";
import { Trophy, Target } from "lucide-react";
import Image from "next/image";
import { useMemberBattleStats } from "@/hooks/useMemberBattleStats";

interface MemberCardProps {
  member: CommunityMemberRes;
}

export function MemberCard({ member }: MemberCardProps) {
  // Early return if member is undefined or null
  if (!member) {
    console.error("[v0] MemberCard: member is undefined or null");
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">Member data not available</div>
        </CardContent>
      </Card>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Intuition OG":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "Core":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const memberName = member.name || "Unknown Member";
  const memberCategory = member.category || "general";

  const { stats, loading: statsLoading } = useMemberBattleStats(member?.id);

  const totalBattles = stats?.total_battles ?? 0;
  const winPercentage = stats?.win_percentage ?? 0;

  return (
    <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar */}
          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-800">
            <Image src={member.avatar_url || "/placeholder.svg?height=96&width=96"} alt={memberName} fill className="object-cover" />
          </div>

          {/* Member Info */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{memberName}</h3>
            {member.name && <p className="text-sm text-gray-400 font-medium">{member.name}</p>}
            {member.description && <p className="text-xs text-gray-500 line-clamp-2 max-w-48">{member.description}</p>}
          </div>

          {/* Category Badge */}
          <Badge className={`text-xs font-medium ${getCategoryColor(memberCategory)}`}>{memberCategory.toUpperCase()}</Badge>

          {/* Stats */}
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-300">{statsLoading ? "..." : totalBattles}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-green-400 font-medium">{statsLoading ? "..." : `${winPercentage.toFixed(1)}%`}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
