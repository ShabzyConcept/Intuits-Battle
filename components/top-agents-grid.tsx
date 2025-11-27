"use client";

import { useState } from "react";
import type { CommunityMemberRes } from "@/types/database";
import { MemberCard } from "./member-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIntuitionClients } from "@/hooks/useIntuitionClients";

interface TopAgentsGridProps {
  initialMembers: CommunityMemberRes[];
}

export function TopAgentsGrid({ initialMembers }: TopAgentsGridProps) {
  const [members, setMembers] = useState<CommunityMemberRes[]>(initialMembers);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "Core", "Intuition OG", "Members"];

  const filteredMembers = selectedCategory === "all" ? members : members.filter((member) => member.category === selectedCategory);

  const sortedMembers = [...filteredMembers].sort((a, b) => b.total_votes - a.total_votes);

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? "bg-blue-600 hover:bg-blue-700" : "border-gray-700 hover:border-blue-500"}>
            {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedMembers.map((member) => (
          <MemberCard key={member?.id} member={member} />
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No members found in this category.</p>
        </div>
      )}
    </div>
  );
}
