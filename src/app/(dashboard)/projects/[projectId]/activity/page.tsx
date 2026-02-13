"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ScrollText, Loader2, Wallet, Lock, Unlock, Check, X, Send, Settings, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { truncateAddress } from "@/lib/utils";
import type { ActivityLog } from "@/types/database";

const ACTION_META: Record<string, { icon: typeof Wallet; label: string; color: string }> = {
  "wallet.added": { icon: Wallet, label: "Wallet added", color: "text-green-400" },
  "wallet.removed": { icon: Wallet, label: "Wallet removed", color: "text-red-400" },
  "wallet.bulk_upload": { icon: Wallet, label: "Bulk upload", color: "text-primary" },
  "list.locked": { icon: Lock, label: "Whitelist locked", color: "text-green-400" },
  "list.unlocked": { icon: Unlock, label: "Whitelist unlocked", color: "text-amber-400" },
  "application.approved": { icon: Check, label: "Application approved", color: "text-green-400" },
  "application.rejected": { icon: X, label: "Application rejected", color: "text-red-400" },
  "collab.sent": { icon: Send, label: "Collab request sent", color: "text-primary" },
  "collab.accepted": { icon: Check, label: "Collab accepted", color: "text-green-400" },
  "collab.declined": { icon: X, label: "Collab declined", color: "text-red-400" },
  "project.updated": { icon: Settings, label: "Project updated", color: "text-muted-foreground" },
  "project.created": { icon: Settings, label: "Project created", color: "text-primary" },
  "timeline.changed": { icon: Calendar, label: "Timeline changed", color: "text-amber-400" },
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function renderDetails(action: string, details: Record<string, unknown> | null): string {
  if (!details) return "";

  switch (action) {
    case "wallet.added":
      return `${truncateAddress(String(details.address || ""), 8)} | ${String(details.category || "").toUpperCase()} | ${details.chain}`;
    case "wallet.removed":
      return `${truncateAddress(String(details.address || ""), 8)} removed`;
    case "wallet.bulk_upload":
      return `${details.added} added, ${details.skipped} skipped, ${details.errors} invalid`;
    case "list.locked":
      return `${details.wallet_count} wallets secured`;
    case "list.unlocked":
      return "Whitelist reopened for modifications";
    case "application.approved":
      return `${truncateAddress(String(details.wallet_address || ""), 8)} approved and added to list`;
    case "application.rejected":
      return `${truncateAddress(String(details.wallet_address || ""), 8)} rejected`;
    case "timeline.changed": {
      const field = String(details.field || "");
      const prev = details.previous_value ? String(details.previous_value) : "not set";
      const next = details.new_value ? String(details.new_value) : "cleared";
      return `${field}: ${prev} \u2192 ${next}`;
    }
    case "project.updated":
      return String(details.summary || "Settings updated");
    default:
      return JSON.stringify(details);
  }
}

export default function ActivityLogPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("activity_log")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(200);
      setLogs((data as ActivityLog[]) || []);
      setLoading(false);
    }
    load();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground">
          Complete audit trail of all actions on this project
        </p>
      </div>

      {logs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ScrollText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No activity recorded yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Actions like adding wallets, locking the whitelist, and reviewing applications will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {logs.map((log) => {
                const meta = ACTION_META[log.action] || {
                  icon: Settings,
                  label: log.action,
                  color: "text-muted-foreground",
                };
                const Icon = meta.icon;
                const detailStr = renderDetails(log.action, log.details);

                return (
                  <div key={log.id} className="flex items-start gap-4 px-6 py-4">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary ${meta.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{meta.label}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {log.action}
                        </Badge>
                      </div>
                      {detailStr && (
                        <p className="mt-0.5 text-sm text-muted-foreground font-mono">
                          {detailStr}
                        </p>
                      )}
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground font-mono">
                      {formatTimestamp(log.created_at)}
                    </time>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
