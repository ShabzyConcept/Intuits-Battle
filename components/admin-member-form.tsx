"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { CommunityMember } from "@/types/database"

interface AdminMemberFormProps {
  member?: CommunityMember
  onSuccess?: () => void
  onCancel?: () => void
}

export function AdminMemberForm({ member, onSuccess, onCancel }: AdminMemberFormProps) {
  const [formData, setFormData] = useState({
    name: member?.name || "",
    title: member?.title || "",
    description: member?.description || "",
    category: member?.category || "general",
    avatar_url: member?.avatar_url || "",
    is_active: member?.is_active ?? true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (member) {
        // Update existing member
        const { error } = await supabase
          .from("community_members")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", member.id)

        if (error) throw error

        toast({
          title: "Member updated",
          description: `${formData.name} has been updated successfully`,
        })
      } else {
        // Create new member
        const { error } = await supabase.from("community_members").insert([formData])

        if (error) throw error

        toast({
          title: "Member created",
          description: `${formData.name} has been added to the community`,
        })
      }

      onSuccess?.()
    } catch (error: any) {
      console.error("Error saving member:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save member",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl text-white">{member ? "Edit Member" : "Add New Member"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter member name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-300">
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="e.g., CEO, Activist, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Brief description of the member"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-300">
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="politics">Politics</SelectItem>
                  <SelectItem value="tech">Technology</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="activism">Activism</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url" className="text-gray-300">
                Avatar URL
              </Label>
              <Input
                id="avatar_url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-700 bg-gray-800"
            />
            <Label htmlFor="is_active" className="text-gray-300">
              Active member
            </Label>
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? "Saving..." : member ? "Update Member" : "Create Member"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="border-gray-700 bg-transparent">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
