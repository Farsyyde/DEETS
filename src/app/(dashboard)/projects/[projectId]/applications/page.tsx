"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ClipboardList,
  Check,
  X,
  Search,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/audit";
import { truncateAddress, formatDate } from "@/lib/utils";
import type { WhitelistApplication, ApplicationStatus, Project } from "@/types/database";

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function ApplicationsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<WhitelistApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadApplications();
  }, [projectId, statusFilter]);

  async function loadApplications() {
    const supabase = createClient();

    const { data: proj } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    setProject(proj as Project);

    let query = supabase
      .from("whitelist_applications")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setApplications((data as WhitelistApplication[]) || []);
    setLoading(false);
  }

  async function handleUpdateStatus(appId: string, status: ApplicationStatus, app: WhitelistApplication) {
    setProcessing((prev) => new Set([...prev, appId]));
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If approving, check if wallet is already on the whitelist
    if (status === "approved") {
      const { data: existing } = await supabase
        .from("wallets")
        .select("id")
        .eq("project_id", projectId)
        .ilike("address", app.wallet_address)
        .eq("status", "active")
        .maybeSingle();

      if (existing) {
        // Wallet already whitelisted — update application status but skip wallet insert
        await supabase
          .from("whitelist_applications")
          .update({
            status,
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", appId);

        await logActivity(projectId, "application.approved", {
          wallet_address: app.wallet_address,
          already_whitelisted: true,
          note: "Wallet was already on the list",
        });

        setProcessing((prev) => {
          const next = new Set(prev);
          next.delete(appId);
          return next;
        });
        loadApplications();
        return;
      }
    }

    // Update application status
    await supabase
      .from("whitelist_applications")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", appId);

    // If approved, add wallet to whitelist
    if (status === "approved") {
      await supabase.from("wallets").insert({
        project_id: projectId,
        address: app.wallet_address,
        chain: app.wallet_chain,
        category: "wl",
        source: "application",
        added_by: user?.id,
        label: `Applied via WL form${app.twitter_handle ? ` (@${app.twitter_handle})` : ""}`,
      });

      await logActivity(projectId, "application.approved", {
        wallet_address: app.wallet_address,
        chain: app.wallet_chain,
        twitter: app.twitter_handle,
      });
    } else {
      await logActivity(projectId, "application.rejected", {
        wallet_address: app.wallet_address,
        chain: app.wallet_chain,
      });
    }

    setProcessing((prev) => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });
    loadApplications();
  }

  async function toggleApplications() {
    const supabase = createClient();
    await supabase
      .from("projects")
      .update({ is_applications_open: !project?.is_applications_open })
      .eq("id", projectId);
    setProject((prev) => prev ? { ...prev, is_applications_open: !prev.is_applications_open } : null);
  }

  const filteredApps = applications.filter((app) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      app.wallet_address.toLowerCase().includes(s) ||
      app.twitter_handle?.toLowerCase().includes(s) ||
      app.discord_handle?.toLowerCase().includes(s)
    );
  });

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">
            {pendingCount > 0
              ? `${pendingCount} pending review`
              : "No applications in the pipeline yet"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {project && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Applications:</span>
              <button
                onClick={toggleApplications}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  project.is_applications_open ? "bg-green-500" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    project.is_applications_open ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className={project.is_applications_open ? "text-green-400" : "text-muted-foreground"}>
                {project.is_applications_open ? "Open" : "Closed"}
              </span>
            </div>
          )}
          {project && (
            <a href={`/p/${project.slug}/apply`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" /> View Form
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by wallet, Twitter, or Discord..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-36"
        />
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No applications in the pipeline</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {project?.is_applications_open
                ? "Share your application link to start receiving whitelist applications."
                : "Enable applications to start receiving whitelist requests."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => (
            <Card key={app.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono">
                        {truncateAddress(app.wallet_address, 8)}
                      </code>
                      <Badge variant={app.wallet_chain as "ethereum" | "solana" | "bitcoin"}>
                        {app.wallet_chain}
                      </Badge>
                      <Badge
                        variant={
                          app.status === "pending"
                            ? "pending"
                            : app.status === "approved"
                            ? "accepted"
                            : "declined"
                        }
                      >
                        {app.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {app.twitter_handle && <span>Twitter: @{app.twitter_handle}</span>}
                      {app.discord_handle && <span>Discord: {app.discord_handle}</span>}
                      <span>Applied {formatDate(app.created_at)}</span>
                    </div>
                    {app.reason && (
                      <p className="text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3 mt-2">
                        {app.reason}
                      </p>
                    )}
                  </div>

                  {app.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(app.id, "rejected", app)}
                        disabled={processing.has(app.id)}
                        className="gap-1 text-red-400 hover:text-red-300"
                      >
                        {processing.has(app.id) ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(app.id, "approved", app)}
                        disabled={processing.has(app.id)}
                        className="gap-1"
                      >
                        {processing.has(app.id) ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
