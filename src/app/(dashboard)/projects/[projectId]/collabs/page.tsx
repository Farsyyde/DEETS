"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Handshake,
  Send,
  Inbox,
  Plus,
  Check,
  X,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/audit";
import { CHAIN_LABELS } from "@/lib/utils";
import type { Project, Collaboration, CollabStatus } from "@/types/database";

type CollabWithProjects = Collaboration & {
  requester_project: Project;
  target_project: Project;
};

export default function CollabsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [incoming, setIncoming] = useState<CollabWithProjects[]>([]);
  const [outgoing, setOutgoing] = useState<CollabWithProjects[]>([]);
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [loading, setLoading] = useState(true);

  // New collab modal
  const [showNewCollab, setShowNewCollab] = useState(false);
  const [searchProjects, setSearchProjects] = useState("");
  const [projectResults, setProjectResults] = useState<Project[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<Project | null>(null);
  const [message, setMessage] = useState("");
  const [sendLoading, setSendLoading] = useState(false);

  useEffect(() => {
    loadCollabs();
  }, [projectId]);

  async function loadCollabs() {
    const supabase = createClient();

    const { data: proj } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    setProject(proj as Project);

    // Incoming collabs (we are the target)
    const { data: inData } = await supabase
      .from("collaborations")
      .select("*, requester_project:projects!collaborations_requester_project_id_fkey(*), target_project:projects!collaborations_target_project_id_fkey(*)")
      .eq("target_project_id", projectId)
      .order("created_at", { ascending: false });
    setIncoming((inData as CollabWithProjects[]) || []);

    // Outgoing collabs (we are the requester)
    const { data: outData } = await supabase
      .from("collaborations")
      .select("*, requester_project:projects!collaborations_requester_project_id_fkey(*), target_project:projects!collaborations_target_project_id_fkey(*)")
      .eq("requester_project_id", projectId)
      .order("created_at", { ascending: false });
    setOutgoing((outData as CollabWithProjects[]) || []);

    setLoading(false);
  }

  async function handleSearchProjects(query: string) {
    setSearchProjects(query);
    if (query.length < 2) {
      setProjectResults([]);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("projects")
      .select("*")
      .neq("id", projectId)
      .ilike("name", `%${query}%`)
      .limit(10);
    setProjectResults((data as Project[]) || []);
  }

  async function handleSendCollab(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTarget) return;
    setSendLoading(true);

    const supabase = createClient();
    await supabase.from("collaborations").insert({
      requester_project_id: projectId,
      target_project_id: selectedTarget.id,
      message: message.trim() || null,
    });

    await logActivity(projectId, "collab.sent", {
      target_project: selectedTarget.name,
      target_project_id: selectedTarget.id,
    });

    setShowNewCollab(false);
    setSelectedTarget(null);
    setMessage("");
    setSendLoading(false);
    loadCollabs();
  }

  async function handleUpdateStatus(collab: CollabWithProjects, status: CollabStatus) {
    const supabase = createClient();
    await supabase
      .from("collaborations")
      .update({ status })
      .eq("id", collab.id);

    const otherProject = tab === "incoming" ? collab.requester_project : collab.target_project;

    if (status === "accepted") {
      await logActivity(projectId, "collab.accepted", {
        partner_project: otherProject?.name,
        partner_project_id: otherProject?.id,
      });
    } else if (status === "declined") {
      await logActivity(projectId, "collab.declined", {
        partner_project: otherProject?.name,
        partner_project_id: otherProject?.id,
      });
    }

    loadCollabs();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const collabs = tab === "incoming" ? incoming : outgoing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collaborations</h1>
          <p className="text-muted-foreground">
            Connect with other projects for cross-promotion
          </p>
        </div>
        <Button onClick={() => setShowNewCollab(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Collab Request
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-1 w-fit">
        <button
          onClick={() => setTab("incoming")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "incoming" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Inbox className="h-4 w-4" />
          Incoming ({incoming.length})
        </button>
        <button
          onClick={() => setTab("outgoing")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "outgoing" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Send className="h-4 w-4" />
          Outgoing ({outgoing.length})
        </button>
      </div>

      {/* Collabs List */}
      {collabs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Handshake className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No {tab} collabs yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {tab === "incoming"
                ? "When other projects send you collab requests, they'll appear here."
                : "Send collab requests to other projects to start cross-promoting."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {collabs.map((collab) => {
            const otherProject =
              tab === "incoming" ? collab.requester_project : collab.target_project;
            return (
              <Card key={collab.id} className="transition-colors hover:border-border/80">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                        {otherProject?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{otherProject?.name || "Unknown Project"}</h3>
                          <Badge variant={collab.status as "pending" | "accepted" | "declined" | "completed"}>
                            {collab.status}
                          </Badge>
                          {otherProject?.chain && (
                            <Badge variant={otherProject.chain as "ethereum" | "solana"}>
                              {CHAIN_LABELS[otherProject.chain]}
                            </Badge>
                          )}
                        </div>
                        {collab.message && (
                          <p className="mt-1 text-sm text-muted-foreground">{collab.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {tab === "incoming" && collab.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(collab, "declined")}
                          className="gap-1 text-red-400 hover:text-red-300"
                        >
                          <X className="h-3.5 w-3.5" /> Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(collab, "accepted")}
                          className="gap-1"
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </Button>
                      </div>
                    )}
                    {collab.status === "accepted" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(collab, "completed")}
                        className="gap-1"
                      >
                        <Check className="h-3.5 w-3.5" /> Mark Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Collab Modal */}
      <Dialog open={showNewCollab} onClose={() => setShowNewCollab(false)}>
        <DialogHeader>
          <DialogTitle>New Collab Request</DialogTitle>
          <DialogDescription>Connect with another project for cross-promotion</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSendCollab} className="space-y-4">
          {/* Search Projects */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Projects</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by project name..."
                value={searchProjects}
                onChange={(e) => handleSearchProjects(e.target.value)}
                className="pl-10"
              />
            </div>
            {projectResults.length > 0 && !selectedTarget && (
              <div className="max-h-40 overflow-y-auto rounded-lg border">
                {projectResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedTarget(p);
                      setSearchProjects("");
                      setProjectResults([]);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-secondary text-left"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{p.name}</span>
                    <Badge variant={p.chain as "ethereum" | "solana"} className="ml-auto">
                      {CHAIN_LABELS[p.chain]}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
            {selectedTarget && (
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                    {selectedTarget.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{selectedTarget.name}</span>
                </div>
                <button type="button" onClick={() => setSelectedTarget(null)}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message (optional)</label>
            <Textarea
              placeholder="Introduce your project and what you're looking for..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowNewCollab(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedTarget || sendLoading}>
              {sendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Request"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
