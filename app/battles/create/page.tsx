"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Check, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAccount } from "wagmi";
import { isAdminWallet } from "@/lib/auth";

interface Member {
  id: string;
  name: string;
  description: string;
  category: string;
  avatar_url: string;
  total_votes: number;
}

export default function CreateBattlePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember1, setSelectedMember1] = useState<Member | null>(null);
  const [selectedMember2, setSelectedMember2] = useState<Member | null>(null);
  const [battleTitle, setBattleTitle] = useState("");
  const [battleDescription, setBattleDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    async function checkAdmin() {
      if (!address || !isConnected) {
        setIsAdmin(false);
        setCheckingAuth(false);
        return;
      }

      try {
        const adminStatus = await isAdminWallet(address);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAdmin();
  }, [address, isConnected, router, toast]);

  useEffect(() => {
    if (isAdmin && !checkingAuth) {
      fetchMembers();
    }
  }, [isAdmin, checkingAuth]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter((member) => member.name.toLowerCase().includes(searchQuery.toLowerCase()) || member.category.toLowerCase().includes(searchQuery.toLowerCase()));
      setFilteredMembers(filtered);
    }
  }, [searchQuery, members]);

  async function fetchMembers() {
    try {
      setLoading(true);
      const { data, error } = await supabaseBrowser.from("community_members").select("*").eq("is_active", true).order("total_votes", { ascending: false });

      if (error) {
        console.error("Error fetching members:", error);
        toast({
          title: "Error",
          description: "Failed to load members",
          variant: "error",
        });
      } else if (data) {
        setMembers(data);
        setFilteredMembers(data);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleMemberSelect(member: Member) {
    if (!selectedMember1) {
      setSelectedMember1(member);
      toast({
        title: "Member 1 Selected",
        description: `${member.name} selected as first contestant`,
      });
    } else if (!selectedMember2 && member.id !== selectedMember1.id) {
      setSelectedMember2(member);
      toast({
        title: "Member 2 Selected",
        description: `${member.name} selected as second contestant`,
      });
    } else if (member.id === selectedMember1.id) {
      setSelectedMember1(null);
      toast({
        title: "Member Deselected",
        description: `${member.name} removed from selection`,
      });
    } else if (selectedMember2 && member.id === selectedMember2.id) {
      setSelectedMember2(null);
      toast({
        title: "Member Deselected",
        description: `${member.name} removed from selection`,
      });
    }
  }

  function isSelected(memberId: string) {
    return selectedMember1?.id === memberId || selectedMember2?.id === memberId;
  }

  async function handleCreateBattle(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedMember1 || !selectedMember2) {
      toast({
        title: "Selection Required",
        description: "Please select two members for the battle",
        variant: "error",
      });
      return;
    }

    if (!battleTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a battle title",
        variant: "error",
      });
      return;
    }

    try {
      setCreating(true);

      const battleData = {
        title: battleTitle,
        description: battleDescription,
        member1_id: parseInt(selectedMember1.id),
        member2_id: parseInt(selectedMember2.id),
        member1_votes: 0,
        member2_votes: 0,
        total_votes: 0,
        is_active: true,
        start_date: new Date().toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
      };

      const { data, error } = await supabaseBrowser.from("battles").insert([battleData]).select().single();

      if (error) {
        console.error("Error creating battle:", error);
        toast({
          title: "Error",
          description: "Failed to create battle",
          variant: "error",
        });
      } else {
        toast({
          title: "Battle Created!",
          description: `${selectedMember1.name} vs ${selectedMember2.name} battle has been created`,
        });
        router.push("/battles");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "error",
      });
    } finally {
      setCreating(false);
    }
  }

  // Show loading or unauthorized state
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="bg-gray-900/50 border-gray-800 p-8">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto" />
            <p className="text-white text-lg">Checking permissions...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="bg-gray-900/50 border-gray-800 p-8 max-w-md">
          <div className="text-center space-y-4">
            <ShieldAlert className="w-16 h-16 text-red-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Access Denied</h2>
            <p className="text-gray-400">Only administrators can create battles.</p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700 mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Show access denied page if not admin
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isConnected || !isAdmin) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="bg-gray-900/50 border-gray-800 max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-6">{!isConnected ? "Please connect your wallet to access this page" : "Only administrators can create battles"}</p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/battles">
              <Button variant="outline" size="icon" className="border-gray-700">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Create Battle</h1>
              <p className="text-gray-400 text-sm">Select two members to compete</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Selection Panel */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Select Contestants</CardTitle>
                <CardDescription className="text-gray-400">Choose two members to battle</CardDescription>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search members by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
                    <p className="text-gray-400 mt-2">Loading members...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                    {filteredMembers.map((member) => (
                      <Card
                        key={member.id}
                        className={`cursor-pointer transition-all duration-200 ${isSelected(member.id) ? "bg-blue-900/30 border-blue-500" : "bg-gray-800/50 border-gray-700 hover:border-gray-600"}`}
                        onClick={() => handleMemberSelect(member)}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-700 shrink-0">
                              <Image src={member.avatar_url || "/placeholder.svg"} alt={member.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-white font-medium truncate">{member.name}</h3>
                                {isSelected(member.id) && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                              </div>
                              <p className="text-gray-400 text-sm truncate">{member.category}</p>
                              <p className="text-gray-500 text-xs">{member.total_votes} votes</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Battle Details Panel */}
          <div>
            <Card className="bg-gray-900/50 border-gray-800 sticky top-4">
              <CardHeader>
                <CardTitle className="text-white">Battle Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateBattle} className="space-y-6">
                  {/* Selected Members Display */}
                  <div className="space-y-3">
                    <Label className="text-gray-300">Selected Contestants</Label>
                    <div className="flex items-center justify-between gap-2">
                      <div className={`flex-1 p-3 rounded-lg border ${selectedMember1 ? "bg-blue-900/20 border-blue-700" : "bg-gray-800 border-gray-700"}`}>
                        {selectedMember1 ? (
                          <div className="flex items-center gap-2">
                            <div className="relative w-8 h-8 rounded overflow-hidden bg-gray-700">
                              <Image src={selectedMember1.avatar_url} alt={selectedMember1.name} fill className="object-cover" />
                            </div>
                            <span className="text-white text-sm truncate">{selectedMember1.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Select Member 1</span>
                        )}
                      </div>
                      <span className="text-gray-400 font-bold">VS</span>
                      <div className={`flex-1 p-3 rounded-lg border ${selectedMember2 ? "bg-purple-900/20 border-purple-700" : "bg-gray-800 border-gray-700"}`}>
                        {selectedMember2 ? (
                          <div className="flex items-center gap-2">
                            <div className="relative w-8 h-8 rounded overflow-hidden bg-gray-700">
                              <Image src={selectedMember2.avatar_url} alt={selectedMember2.name} fill className="object-cover" />
                            </div>
                            <span className="text-white text-sm truncate">{selectedMember2.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Select Member 2</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Battle Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-300">
                      Battle Title *
                    </Label>
                    <Input
                      id="title"
                      value={battleTitle}
                      onChange={(e) => setBattleTitle(e.target.value)}
                      placeholder="e.g., Epic Community Showdown"
                      required
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  {/* Battle Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-300">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={battleDescription}
                      onChange={(e) => setBattleDescription(e.target.value)}
                      placeholder="Describe the battle..."
                      className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-gray-300">
                      End Date (Optional)
                    </Label>
                    <Input id="endDate" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
                  </div>

                  {/* Create Button */}
                  <Button type="submit" disabled={!selectedMember1 || !selectedMember2 || !battleTitle || creating} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700">
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Battle...
                      </>
                    ) : (
                      "Create Battle"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
