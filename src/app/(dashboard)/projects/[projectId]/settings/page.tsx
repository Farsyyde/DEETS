"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Trash2, Save, Lock, Unlock, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/audit";
import type { Project } from "@/types/database";

const chainOptions = [
  { value: "ethereum", label: "Ethereum" },
  { value: "solana", label: "Solana" },
  { value: "bitcoin", label: "Bitcoin" },
  { value: "polygon", label: "Polygon" },
  { value: "base", label: "Base" },
  { value: "other", label: "Other" },
];

function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().slice(0, 16);
}

function formatLockTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [locking, setLocking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    chain: "",
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

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      const proj = data as Project;
      setProject(proj);
      if (proj) {
        setForm({
          name: proj.name,
          description: proj.description || "",
          chain: proj.chain,
          twitter_url: proj.twitter_url || "",
          discord_url: proj.discord_url || "",
          website_url: proj.website_url || "",
          marketplace_url: proj.marketplace_url || "",
          supply: proj.supply?.toString() || "",
          mint_price: proj.mint_price || "",
          wl_spots_total: proj.wl_spots_total.toString(),
          gtd_spots_total: proj.gtd_spots_total.toString(),
          wl_open_date: formatDateForInput(proj.wl_open_date),
          wl_close_date: formatDateForInput(proj.wl_close_date),
          snapshot_date: formatDateForInput(proj.snapshot_date),
          mint_date: formatDateForInput(proj.mint_date),
        });
      }
      setLoading(false);
    }
    load();
  }, [projectId]);

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const updates: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      chain: form.chain,
      twitter_url: form.twitter_url.trim() || null,
      discord_url: form.discord_url.trim() || null,
      website_url: form.website_url.trim() || null,
      marketplace_url: form.marketplace_url.trim() || null,
      supply: form.supply ? parseInt(form.supply) : null,
      mint_price: form.mint_price.trim() || null,
      wl_spots_total: parseInt(form.wl_spots_total) || 0,
      gtd_spots_total: parseInt(form.gtd_spots_total) || 0,
      wl_open_date: form.wl_open_date ? new Date(form.wl_open_date).toISOString() : null,
      wl_close_date: form.wl_close_date ? new Date(form.wl_close_date).toISOString() : null,
      snapshot_date: form.snapshot_date ? new Date(form.snapshot_date).toISOString() : null,
      mint_date: form.mint_date ? new Date(form.mint_date).toISOString() : null,
    };

    const supabase = createClient();
    const { error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      // Log timeline changes
      const timelineFields = ["wl_open_date", "wl_close_date", "snapshot_date", "mint_date"] as const;
      for (const field of timelineFields) {
        const prev = project?.[field] ? new Date(project[field] as string).toISOString() : null;
        const next = updates[field] as string | null;
        if (prev !== next) {
          await logActivity(projectId, "timeline.changed", {
            field,
            previous_value: prev,
            new_value: next,
          });
        }
      }

      // Log general project update
      await logActivity(projectId, "project.updated", {
        summary: "Project settings updated",
      });

      // Refresh project state
      const { data: refreshed } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (refreshed) setProject(refreshed as Project);

      setMessage("Settings saved");
    }
    setSaving(false);
  }

  async function handleLock() {
    setLocking(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("projects")
      .update({
        is_locked: true,
        locked_at: new Date().toISOString(),
        locked_by: user?.id,
      })
      .eq("id", projectId);

    if (!error) {
      await logActivity(projectId, "list.locked", {
        wallet_count: project?.wl_spots_filled ?? 0,
      });

      const { data: refreshed } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (refreshed) setProject(refreshed as Project);
      setMessage("Whitelist locked. Snapshot secured.");
    }
    setLocking(false);
    setShowLockDialog(false);
  }

  async function handleUnlock() {
    setLocking(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("projects")
      .update({
        is_locked: false,
        locked_at: null,
        locked_by: null,
      })
      .eq("id", projectId);

    if (!error) {
      await logActivity(projectId, "list.unlocked", {
        previously_locked_at: project?.locked_at,
      });

      const { data: refreshed } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (refreshed) setProject(refreshed as Project);
      setMessage("Whitelist unlocked. Changes are now permitted.");
    }
    setLocking(false);
    setShowUnlockDialog(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("projects").delete().eq("id", projectId);
    router.push("/dashboard");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your launch parameters</p>
      </div>

      {/* Lock Status Card */}
      <Card className={project?.is_locked ? "border-green-500/30" : "border-border"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${project?.is_locked ? "bg-green-500/10" : "bg-secondary"}`}>
                {project?.is_locked ? (
                  <Lock className="h-5 w-5 text-green-400 lock-pulse" />
                ) : (
                  <Unlock className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Whitelist Lock
                  <Badge variant={project?.is_locked ? "default" : "outline"} className={project?.is_locked ? "bg-green-500/10 text-green-400 border-green-500/20" : ""}>
                    {project?.is_locked ? "Locked" : "Unlocked"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {project?.is_locked
                    ? `Locked on ${formatLockTimestamp(project.locked_at!)}`
                    : "Lock your whitelist to prevent any modifications"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {project?.is_locked ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-green-500/5 border border-green-500/10 px-4 py-3">
                <Shield className="h-4 w-4 text-green-400 shrink-0" />
                <p className="text-sm text-green-400">
                  Whitelist is fortified. No wallets can be added or removed.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowUnlockDialog(true)}
                className="gap-2"
              >
                <Unlock className="h-4 w-4" /> Unlock Whitelist
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Once locked, no wallets can be added or removed until you unlock.
                This action and its timestamp are permanently recorded and visible on your public page.
              </p>
              <Button
                onClick={() => setShowLockDialog(true)}
                className="gap-2"
              >
                <Lock className="h-4 w-4" /> Lock Whitelist
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {message && (
          <div
            className={`rounded-md px-4 py-3 text-sm ${
              message.startsWith("Error")
                ? "bg-destructive/10 border border-destructive/20 text-destructive"
                : "bg-green-500/10 border border-green-500/20 text-green-400"
            }`}
          >
            {message}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
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
            {project && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Public URL Slug</label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <code className="rounded bg-secondary px-2 py-1">/p/{project.slug}</code>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <CardTitle>Timeline</CardTitle>
            </div>
            <CardDescription>
              Set your launch timeline. Changes to these dates are permanently recorded in your audit log.
            </CardDescription>
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
                <p className="text-xs text-muted-foreground">When your whitelist starts accepting entries</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">WL Closes</label>
                <Input
                  type="datetime-local"
                  value={form.wl_close_date}
                  onChange={(e) => updateForm("wl_close_date", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Deadline for whitelist submissions</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Snapshot Date</label>
                <Input
                  type="datetime-local"
                  value={form.snapshot_date}
                  onChange={(e) => updateForm("snapshot_date", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">When the final list snapshot is taken</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mint Date</label>
                <Input
                  type="datetime-local"
                  value={form.mint_date}
                  onChange={(e) => updateForm("mint_date", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Your public mint launch date</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Twitter/X</label>
                <Input value={form.twitter_url} onChange={(e) => updateForm("twitter_url", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Discord</label>
                <Input value={form.discord_url} onChange={(e) => updateForm("discord_url", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Website</label>
                <Input value={form.website_url} onChange={(e) => updateForm("website_url", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Marketplace</label>
                <Input
                  value={form.marketplace_url}
                  onChange={(e) => updateForm("marketplace_url", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spots & Supply</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">WL Spots Total</label>
                <Input
                  type="number"
                  value={form.wl_spots_total}
                  onChange={(e) => updateForm("wl_spots_total", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">GTD Spots Total</label>
                <Input
                  type="number"
                  value={form.gtd_spots_total}
                  onChange={(e) => updateForm("gtd_spots_total", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Supply</label>
                <Input
                  type="number"
                  value={form.supply}
                  onChange={(e) => updateForm("supply", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mint Price</label>
                <Input value={form.mint_price} onChange={(e) => updateForm("mint_price", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </form>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Permanently delete this project and all its data</CardDescription>
        </CardHeader>
        <CardContent>
          {!showDeleteConfirm ? (
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="gap-2">
              <Trash2 className="h-4 w-4" /> Delete Project
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Type <strong>{project?.name}</strong> to confirm deletion.
              </p>
              <Input
                placeholder="Type project name to confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={deleteConfirmText !== project?.name || deleting}
                  onClick={handleDelete}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Permanently Delete"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lock Confirmation Dialog */}
      <Dialog open={showLockDialog} onClose={() => setShowLockDialog(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> Lock Whitelist
          </DialogTitle>
          <DialogDescription>
            Your whitelist will be locked. No wallets can be added or removed until you unlock.
            This action and its timestamp are permanently recorded and visible on your public page.
            Your community will see exactly when the list was finalized.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setShowLockDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleLock} disabled={locking} className="gap-2">
            {locking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Lock Whitelist
          </Button>
        </div>
      </Dialog>

      {/* Unlock Confirmation Dialog */}
      <Dialog open={showUnlockDialog} onClose={() => setShowUnlockDialog(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-amber-400" /> Unlock Whitelist
          </DialogTitle>
          <DialogDescription>
            Unlocking your whitelist will allow modifications again. This action is permanently
            recorded in your audit log. Your community will see that the list was reopened after
            being locked.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setShowUnlockDialog(false)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleUnlock} disabled={locking} className="gap-2">
            {locking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
            Unlock Whitelist
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
