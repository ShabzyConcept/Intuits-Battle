"use client";

import { useEffect, useState } from "react";
import { TopAgentsGrid } from "@/components/top-agents-grid";
import { WalletConnect } from "@/components/wallet-connect";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Zap, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useIntuitionClients } from "@/hooks/useIntuitionClients";
import { supabaseBrowser } from "@/lib/supabase/client";
import { createAtomFromThing } from "@0xintuition/sdk";
import { toast, useToast } from "@/hooks/use-toast";
import { CommunityMemberRes } from "@/types/database";

interface CreateMemberDialogProps {
  onSuccess?: () => void;
}

function CreateMemberDialog({ onSuccess }: CreateMemberDialogProps) {
  const client = useIntuitionClients();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    url: "",
    category: "Members",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!client) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "error",
      });
      setLoading(false);
      return;
    }

    try {
      const atomPayload = {
        description: formData.description,
        image: formData.image,
        name: formData.name,
        url: formData.url,
      };

      const memberAtom = await createAtomFromThing(client, atomPayload);

      const { error } = await supabaseBrowser
        .from("community_members")
        .insert([
          {
            atomId: memberAtom.state.termId,
            name: formData.name,
            description: formData.description,
            image: formData.image,
            category: formData.category,
            avatar_url: formData.image,
            total_votes: 0,
            upvotes: 0,
            downvotes: 0,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Failed to insert member:", error);
        toast({
          title: "Error",
          description: "Failed to add member to the community.",
          variant: "error",
        });
        return;
      }

      toast({
        title: "Member created",
        description: `${formData.name} has been added to the community`,
      });

      setFormData({ name: "", description: "", image: "", url: "", category: "Members" });
      setOpen(false);

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed creating member:", err);
      toast({
        title: "Error",
        description: "Something went wrong while creating the member.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Create Member
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Community Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 block mb-2">Name</label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Member name" required className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300 block mb-2">Image URI</label>
            <Input value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} placeholder="Image URL" required className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300 block mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Member description"
              required
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 block mb-2">URL</label>
            <Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="Enter website URL" className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300 block mb-2">Category</label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="Core">Core</SelectItem>
                <SelectItem value="Intuition OG">Intuition OG</SelectItem>
                <SelectItem value="Members">Members</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Member"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function HomePage() {
  const [members, setMembers] = useState<CommunityMemberRes[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseBrowser.from("community_members").select("*").eq("is_active", true).order("total_votes", { ascending: false });

      if (error) {
        console.error("Error fetching members:", error);
        toast({
          title: "Failed to fetch members",
          description: "There was an error fetching the community members.",
          variant: "error",
        });
      } else if (data) {
        setMembers(data);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Unexpected error",
        description: "Something went wrong while fetching members.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Intuit 👁️ Battle</h1>
            </div>

            <div className="flex items-center space-x-4">
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              <span className="bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Intuit 👁️</span> <span className="text-white">Battle</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Vote for your favorite community leaders and watch them compete in epic battles. Shape the future of our community through democratic participation on the Intuition Network.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <CreateMemberDialog onSuccess={fetchMembers} />
              <Link href="/battles">
                <Button size="lg" variant="outline" className="border-gray-700 hover:border-blue-500 px-8 bg-transparent">
                  <Zap className="w-5 h-5 mr-2" />
                  Watch Battles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Community Members Section */}
      <section id="members" className="py-16 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Community Members</h2>
            <p className="text-gray-400">Vote for the most influential community members</p>
          </div>

          {loading ? <div className="text-center text-gray-400 py-12">Loading members...</div> : <TopAgentsGrid initialMembers={members} />}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 Intuit 👁️ Battle System. Built on Intuition Network.</p>
        </div>
      </footer>
    </div>
  );
}
