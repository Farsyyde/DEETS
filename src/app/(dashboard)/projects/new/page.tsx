"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/lib/audit";

const chainOptions = [
  { value: "ethereum", label: "Ethereum" },
  { value: "solana", label: "Solana" },
  { value: "bitcoin", label: "Bitcoin" },
  { value: "polygon", label: "Polygon" },
  { value: "base", label: "Base" },
  { value: "other", label: "Other" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    chain: "ethereum",
    twitter_url: "",
    discord_url: "",
    website_url: "",
    marketplace_url: "",
    supply: "",
    mint_price: "",
    wl_spots_total: "",
    gtd_spots_total: "",
    wl_open_date: "",
    wl_close_date: "",
    snapshot_date: "",
    mint_date: "",
  });

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.name.trim()) {
      setError("Project name is required");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in");
      setLoading(false);
      return;
    }

    const slug = slugify(form.name) + "-" + Math.random().toString(36).substring(2, 6);

    const { data, error: insertError } = await supabase
      .from("projects")
      .insert({
        owner_id: user.id,
        name: form.name.trim(),
        slug,
        description: form.description.trim() || null,
        chain: form.chain,
        twitter_url: form.twitter_url.trim() || null,
        discord_url: form.discord_url.trim() || null,
        website_url: form.website_url.trim() || null,
        marketplace_url: form.marketplace_url.trim() || null,
        supply: form.supply ? parseInt(form.supply) : null,
        mint_price: form.mint_price.trim() || null,
        wl_spots_total: form.wl_spots_total ? parseInt(form.wl_spots_total) : 0,
        gtd_spots_total: form.gtd_spots_total ? parseInt(form.gtd_spots_total) : 0,
        wl_open_date: form.wl_open_date ? new Date(form.wl_open_date).toISOString() : null,
        wl_close_date: form.wl_close_date ? new Date(form.wl_close_date).toISOString() : null,
        snapshot_date: form.snapshot_date ? new Date(form.snapshot_date).toISOString() : null,
        mint_date: form.mint_date ? new Date(form.mint_date).toISOString() : null,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    await logActivity(data.id, "project.created", {
      name: form.name.trim(),
      chain: form.chain,
    });

    router.push(`/projects/${data.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Launch</h1>
        <p className="text-muted-foreground">Set up your launch room. Configure your whitelist, timeline, and team.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
            <CardDescription>Your project name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name *</label>
              <Input
                placeholder="e.g. Bored Apes, DeGods, Azuki..."
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Tell people about your project..."
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Blockchain</label>
              <Select
                options={chainOptions}
                value={form.chain}
                onChange={(e) => updateForm("chain", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <CardTitle>Timeline</CardTitle>
            </div>
            <CardDescription>Set your launch timeline. You can update these later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">WL Opens</label>
                <Input
                  type="datetime-local"
                  value={form.wl_open_date}
                  onChange={(e) => updateForm("wl_open_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">WL Closes</label>
                <Input
                  type="datetime-local"
                  value={form.wl_close_date}
                  onChange={(e) => updateForm("wl_close_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Snapshot Date</label>
                <Input
                  type="datetime-local"
                  value={form.snapshot_date}
                  onChange={(e) => updateForm("snapshot_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mint Date</label>
                <Input
                  type="datetime-local"
                  value={form.mint_date}
                  onChange={(e) => updateForm("mint_date", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
            <CardDescription>Connect your project&apos;s social and marketplace links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Twitter/X</label>
                <Input
                  placeholder="https://x.com/yourproject"
                  value={form.twitter_url}
                  onChange={(e) => updateForm("twitter_url", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Discord</label>
                <Input
                  placeholder="https://discord.gg/yourserver"
                  value={form.discord_url}
                  onChange={(e) => updateForm("discord_url", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Website</label>
                <Input
                  placeholder="https://yourproject.com"
                  value={form.website_url}
                  onChange={(e) => updateForm("website_url", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Marketplace</label>
                <Input
                  placeholder="https://opensea.io/collection/..."
                  value={form.marketplace_url}
                  onChange={(e) => updateForm("marketplace_url", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spots & Supply */}
        <Card>
          <CardHeader>
            <CardTitle>Spots & Supply</CardTitle>
            <CardDescription>Whitelist allocation and collection details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">WL Spots</label>
                <Input
                  type="number"
                  placeholder="Total WL spots available"
                  value={form.wl_spots_total}
                  onChange={(e) => updateForm("wl_spots_total", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">GTD Spots</label>
                <Input
                  type="number"
                  placeholder="Total guaranteed spots"
                  value={form.gtd_spots_total}
                  onChange={(e) => updateForm("gtd_spots_total", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Supply</label>
                <Input
                  type="number"
                  placeholder="e.g. 10000"
                  value={form.supply}
                  onChange={(e) => updateForm("supply", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mint Price</label>
                <Input
                  placeholder="e.g. 0.08 ETH"
                  value={form.mint_price}
                  onChange={(e) => updateForm("mint_price", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Launch"}
          </Button>
        </div>
      </form>
    </div>
  );
}
