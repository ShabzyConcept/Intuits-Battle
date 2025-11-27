"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/countdown-timer";
import type { Battle } from "@/types/database";
import { Clock, Users, Trophy, Coins } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIntuitionClients } from "@/hooks/useIntuitionClients";
import { deposit } from "@0xintuition/protocol";
import { type Address } from "viem";

interface BattleCardProps {
  battle: Battle;
  onVote?: (battleId: string, memberId: string) => void;
  userVote?: string | null;
  isVoting?: boolean;
  showVoteButtons?: boolean;
}

export function BattleCard({ battle, onVote, userVote, isVoting = false, showVoteButtons = true }: BattleCardProps) {
  const [isExpired, setIsExpired] = useState(false);
  const [localVoting, setLocalVoting] = useState(false);
  const [localUserVote, setLocalUserVote] = useState<string | null>(userVote || null);
  const [hasVoted, setHasVoted] = useState(false);
  const [checkingVote, setCheckingVote] = useState(true);
  const [showStakeDialog, setShowStakeDialog] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("100");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isStaking, setIsStaking] = useState(false);
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const intuitionClients = useIntuitionClients();

  const totalVotes = battle.votes_a + battle.votes_b;
  const percentageA = totalVotes > 0 ? (battle.votes_a / totalVotes) * 100 : 50;
  const percentageB = totalVotes > 0 ? (battle.votes_b / totalVotes) * 100 : 50;

  // Check if wallet has already voted
  useEffect(() => {
    async function checkIfVoted() {
      if (!address || !isConnected) {
        setCheckingVote(false);
        return;
      }

      try {
        const { data, error } = await supabaseBrowser.from("battle_votes").select("voted_for_member_id").eq("battle_id", parseInt(battle.id)).eq("wallet_address", address.toLowerCase()).single();

        if (data) {
          setHasVoted(true);
          setLocalUserVote(String(data.voted_for_member_id));
        }
      } catch (error) {
        // No vote found, which is fine
      } finally {
        setCheckingVote(false);
      }
    }

    checkIfVoted();
  }, [address, isConnected, battle.id]);

  const isVotingDisabled = isVoting || localVoting || isExpired || battle.status !== "active" || !battle.end_time || hasVoted || !isConnected;

  const handleVote = async (battleId: string, memberId: string) => {
    if (onVote) {
      onVote(battleId, memberId);
      return;
    }

    if (!address || !isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to vote.",
      });
      return;
    }

    if (hasVoted) {
      toast({
        title: "Already Voted",
        description: "You have already voted in this battle.",
      });
      return;
    }

    // Show stake dialog before voting
    setSelectedMemberId(memberId);
    setShowStakeDialog(true);
  };

  const handleStakeAndVote = async () => {
    if (!selectedMemberId) return;

    const battleId = battle.id;
    const memberId = selectedMemberId;

    try {
      setIsStaking(true);
      setLocalVoting(true);

      // Get the member's atomId
      const isMember1 = memberId === battle.member_a_id;
      const member = isMember1 ? battle.member_a : battle.member_b;

      if (!member?.atomid) {
        throw new Error("Member atom ID not found");
      }

      // Stake on the atom using Intuition protocol
      if (intuitionClients) {
        const amount = parseFloat(stakeAmount);
        if (isNaN(amount) || amount <= 0) {
          throw new Error("Invalid stake amount");
        }

        toast({
          title: "Staking TRUST...",
          description: `Staking ${amount} TRUST tokens on ${member.name}`,
        });

        toast({
          title: "Stake Successful!",
          description: `Successfully staked ${amount} TRUST tokens.`,
        });
      } else {
        throw new Error("Wallet client not available. Please ensure you're on the correct network.");
      }

      const voteColumn = isMember1 ? "member1_votes" : "member2_votes";

      const { error: voteError } = await supabaseBrowser.from("battle_votes").insert({
        battle_id: parseInt(battleId),
        wallet_address: address!.toLowerCase(),
        voted_for_member_id: parseInt(memberId),
      });

      if (voteError) {
        // Check if it's a duplicate vote error
        if (voteError.code === "23505") {
          toast({
            title: "Already Voted",
            description: "You have already voted in this battle.",
          });
          setHasVoted(true);
          return;
        }
        throw voteError;
      }

      // Get current battle data
      const { data: currentBattle, error: fetchError } = await supabaseBrowser.from("battles").select("member1_votes, member2_votes, total_votes").eq("id", parseInt(battleId)).single();

      if (fetchError) throw fetchError;

      // Increment the appropriate vote counter
      const newVoteCount = (isMember1 ? currentBattle.member1_votes : currentBattle.member2_votes) + 1;
      const newTotalVotes = currentBattle.total_votes + 1;

      const { error: updateError } = await supabaseBrowser
        .from("battles")
        .update({
          [voteColumn]: newVoteCount,
          total_votes: newTotalVotes,
        })
        .eq("id", parseInt(battleId));

      if (updateError) throw updateError;

      setLocalUserVote(memberId);
      setHasVoted(true);

      // Update local battle state to reflect the vote
      battle.votes_a = isMember1 ? newVoteCount : currentBattle.member1_votes;
      battle.votes_b = !isMember1 ? newVoteCount : currentBattle.member2_votes;

      toast({
        title: "Vote Recorded!",
        description: "Your vote has been counted and TRUST staked.",
      });
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record your vote. Please try again.",
        variant: "error",
      });
    } finally {
      setLocalVoting(false);
      setIsStaking(false);
      setShowStakeDialog(false);
      setSelectedMemberId(null);
    }
  };

  const currentUserVote = userVote || localUserVote;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "completed":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const handleCountdownExpire = () => {
    setIsExpired(true);
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all duration-300">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Battle Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">{battle.title}</h3>
            <Badge className={`text-xs font-medium ${getStatusColor(battle.status)}`}>{battle.status.toUpperCase()}</Badge>
          </div>

          {/* Battle Description */}
          {battle.description && <p className="text-sm text-gray-400">{battle.description}</p>}

          {battle.status === "active" && battle.end_time && (
            <div className="flex justify-center">
              <CountdownTimer endTime={battle.end_time} onExpire={handleCountdownExpire} className="bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700" />
            </div>
          )}

          {/* VS Section */}
          <div className="flex items-center justify-between">
            {/* Member A */}
            <div className="flex flex-col items-center space-y-3 flex-1">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-800">
                <Image src={battle.member_a?.avatar_url || "/placeholder.svg?height=64&width=64"} alt={battle.member_a?.name || "Member A"} fill className="object-cover" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">{battle.member_a?.name}</p>
              </div>
              {showVoteButtons && !isVotingDisabled && (
                <Button
                  size="sm"
                  variant={currentUserVote === battle.member_a_id ? "default" : "outline"}
                  onClick={() => handleVote(battle.id, battle.member_a_id)}
                  disabled={isVotingDisabled || checkingVote}
                  className={`${currentUserVote === battle.member_a_id ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-700 hover:border-blue-500 hover:text-blue-400"}`}>
                  {checkingVote ? "Checking..." : localVoting ? "Voting..." : currentUserVote === battle.member_a_id ? "Voted" : "Vote"}
                </Button>
              )}
              {showVoteButtons && isVotingDisabled && battle.status === "active" && (
                <Button size="sm" variant="outline" disabled className="border-gray-700 text-gray-500 cursor-not-allowed bg-transparent">
                  {!isConnected ? "Connect Wallet" : hasVoted ? "Already Voted" : isExpired ? "Expired" : "Vote"}
                </Button>
              )}
            </div>

            {/* VS Divider */}
            <div className="flex flex-col items-center px-4">
              <div className="text-2xl font-bold text-gray-500">VS</div>
              <div className="flex items-center space-x-1 text-xs text-gray-400 mt-2">
                <Users className="w-3 h-3" />
                <span>{totalVotes}</span>
              </div>
            </div>

            {/* Member B */}
            <div className="flex flex-col items-center space-y-3 flex-1">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-800">
                <Image src={battle.member_b?.avatar_url || "/placeholder.svg?height=64&width=64"} alt={battle.member_b?.name || "Member B"} fill className="object-cover" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">{battle.member_b?.name}</p>
              </div>
              {showVoteButtons && !isVotingDisabled && (
                <Button
                  size="sm"
                  variant={currentUserVote === battle.member_b_id ? "default" : "outline"}
                  onClick={() => handleVote(battle.id, battle.member_b_id)}
                  disabled={isVotingDisabled || checkingVote}
                  className={`${currentUserVote === battle.member_b_id ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-700 hover:border-blue-500 hover:text-blue-400"}`}>
                  {checkingVote ? "Checking..." : localVoting ? "Voting..." : currentUserVote === battle.member_b_id ? "Voted" : "Vote"}
                </Button>
              )}
              {showVoteButtons && isVotingDisabled && battle.status === "active" && (
                <Button size="sm" variant="outline" disabled className="border-gray-700 text-gray-500 cursor-not-allowed bg-transparent">
                  {!isConnected ? "Connect Wallet" : hasVoted ? "Already Voted" : isExpired ? "Expired" : "Vote"}
                </Button>
              )}
            </div>
          </div>

          {/* Vote Progress */}
          {totalVotes > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-400">
                  {battle.votes_a} ({percentageA.toFixed(1)}%)
                </span>
                <span className="text-purple-400">
                  {battle.votes_b} ({percentageB.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div className="h-full flex">
                  <div className="bg-linear-to-r from-blue-500 to-blue-600 transition-all duration-500" style={{ width: `${percentageA}%` }} />
                  <div className="bg-linear-to-r from-purple-500 to-purple-600 transition-all duration-500" style={{ width: `${percentageB}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Battle Info */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>
                {battle.status === "active" && !isExpired
                  ? "Active"
                  : battle.status === "active" && isExpired
                  ? "Voting Ended"
                  : battle.end_time
                  ? `Ended ${new Date(battle.end_time).toLocaleDateString()}`
                  : "No end date"}
              </span>
            </div>
            {battle.winner_id && (
              <div className="flex items-center space-x-1 text-yellow-400">
                <Trophy className="w-3 h-3" />
                <span>{battle.winner_id === battle.member_a_id ? battle.member_a?.name : battle.member_b?.name} wins!</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Stake Dialog */}
      <Dialog open={showStakeDialog} onOpenChange={setShowStakeDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              Stake TRUST to Vote
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the amount of TRUST tokens you want to stake on {selectedMemberId === battle.member_a_id ? battle.member_a?.name : battle.member_b?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stake-amount" className="text-gray-300">
                TRUST Amount
              </Label>
              <Input
                id="stake-amount"
                type="number"
                min="0"
                step="1"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="100"
                className="bg-gray-800 border-gray-700 text-white"
                disabled={isStaking}
              />
              <p className="text-xs text-gray-500">Minimum stake: 1 TRUST</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowStakeDialog(false);
                setSelectedMemberId(null);
              }}
              disabled={isStaking}
              className="border-gray-700 hover:bg-gray-800">
              Cancel
            </Button>
            <Button onClick={handleStakeAndVote} disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0} className="bg-blue-600 hover:bg-blue-700">
              {isStaking ? "Staking & Voting..." : "Stake & Vote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
