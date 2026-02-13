"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  Handshake,
  ClipboardList,
  Users,
  ExternalLink,
  ArrowRight,
  Copy,
  Check,
  Lock,
  Unlock,
  ScrollText,
  Calendar,
  Shield,
  Circle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { CHAIN_LABELS, formatNumber, formatDate } from "@/lib/utils";
import { computeReadiness, getReadinessScore } from "@/lib/readiness";
import type { Project, Wallet as WalletType, ReadinessItem } from "@/types/database";

const CATEGORY_DISPLAY: Record<string, string> = {
  whitelist: "Whitelist & Timeline",
  timeline: "Whitelist & Timeline",
  profile: "Profile",
  assets: "Coming Soon",
  contract: "Coming Soon",
  distribution: "Coming Soon",
};

function groupReadinessItems(items: ReadinessItem[]) {
  const groups: { label: string; items: ReadinessItem[] }[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const groupLabel = CATEGORY_DISPLAY[item.category] || item.category;
    if (!seen.has(groupLabel)) {
      seen.add(groupLabel);
      groups.push({ label: groupLabel, items: [] });
    }
    groups.find((g) => g.label === groupLabel)!.items.push(item);
  }

  return groups;
}

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [walletCount, setWalletCount] = useState(0);
  const [collabCount, setCollabCount] = useState(0);
  const [pendingApps, setPendingApps] = useState(0);
  const [recentWallets, setRecentWallets] = useState<WalletType[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: proj } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      setProject(proj as Project);

      const { count: wCount } = await supabase
        .from("wallets")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("status", "active");
      setWalletCount(wCount || 0);

      const { count: cCount } = await supabase
        .from("collaborations")
        .select("*", { count: "exact", head: true })
        .or(`requester_project_id.eq.${projectId},target_project_id.eq.${projectId}`);
      setCollabCount(cCount || 0);

      const { count: aCount } = await supabase
        .from("whitelist_applications")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("status", "pending");
      setPendingApps(aCount || 0);

      const { data: recent } = await supabase
        .from("wallets")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentWallets((recent as WalletType[]) || []);
    }
    load();
  }, [projectId]);

  if (!project) return null;

  const publicUrl = `/p/${project.slug}`;

  function copyPublicLink() {
    navigator.clipboard.writeText(window.location.origin + publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const stats = [
    {
      label: "Total Wallets",
      value: formatNumber(walletCount),
      icon: Wallet,
      href: `/projects/${projectId}/whitelist`,
      color: "text-primary",
    },
    {
      label: "WL Filled",
      value: `${project.wl_spots_filled}/${project.wl_spots_total || "\u221E"}`,
      icon: Users,
      href: `/projects/${projectId}/whitelist`,
      color: "text-primary",
    },
    {
      label: "GTD Filled",
      value: `${project.gtd_spots_filled}/${project.gtd_spots_total || "\u221E"}`,
      icon: Users,
      href: `/projects/${projectId}/whitelist`,
      color: "text-green-400",
    },
    {
      label: "Collabs",
      value: formatNumber(collabCount),
      icon: Handshake,
      href: `/projects/${projectId}/collabs`,
      color: "text-blue-400",
    },
    {
      label: "Pending Apps",
      value: formatNumber(pendingApps),
      icon: ClipboardList,
      href: `/projects/${projectId}/applications`,
      color: "text-amber-400",
    },
  ];

  const timelineItems = [
    { label: "WL Opens", date: project.wl_open_date },
    { label: "WL Closes", date: project.wl_close_date },
    { label: "Snapshot", date: project.snapshot_date },
    { label: "Mint", date: project.mint_date },
  ].filter((t) => t.date);

  const readinessItems = computeReadiness(project, projectId);
  const readinessScore = getReadinessScore(readinessItems);
  const readinessGroups = groupReadinessItems(readinessItems);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={project.chain as "ethereum" | "solana" | "bitcoin" | "polygon" | "base"}>
              {CHAIN_LABELS[project.chain] || project.chain}
            </Badge>
            {project.is_locked ? (
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20 gap-1">
                <Lock className="h-3 w-3" /> Locked
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Unlock className="h-3 w-3" /> Unlocked
              </Badge>
            )}
          </div>
          {project.description && (
            <p className="mt-1 text-muted-foreground max-w-xl">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyPublicLink} className="gap-2">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Public Link"}
          </Button>
          <Link href={publicUrl} target="_blank">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-3.5 w-3.5" /> View Public Page
            </Button>
          </Link>
        </div>
      </div>

      {/* Lock Status Banner */}
      {project.is_locked && project.locked_at && (
        <div className="flex items-center gap-3 rounded-lg bg-green-500/5 border border-green-500/10 px-4 py-3">
          <Lock className="h-4 w-4 text-green-400 lock-pulse shrink-0" />
          <p className="text-sm text-green-400">
            Whitelist is fortified. {walletCount} wallets secured. Locked on {formatDate(project.locked_at)}.
          </p>
        </div>
      )}

      {/* Quick Links */}
      {(project.twitter_url || project.discord_url || project.website_url) && (
        <div className="flex gap-3 flex-wrap">
          {project.twitter_url && (
            <a href={project.twitter_url} target="_blank" rel="noopener noreferrer">
              <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-secondary">
                Twitter/X <ExternalLink className="h-3 w-3" />
              </Badge>
            </a>
          )}
          {project.discord_url && (
            <a href={project.discord_url} target="_blank" rel="noopener noreferrer">
              <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-secondary">
                Discord <ExternalLink className="h-3 w-3" />
              </Badge>
            </a>
          )}
          {project.website_url && (
            <a href={project.website_url} target="_blank" rel="noopener noreferrer">
              <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-secondary">
                Website <ExternalLink className="h-3 w-3" />
              </Badge>
            </a>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:border-primary/30 cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="mt-3 text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Timeline */}
      {timelineItems.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 flex-wrap">
              {timelineItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{item.label}:</span>
                  <span className="text-sm font-mono">{formatDate(item.date!)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Launch Readiness */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <div>
              <CardTitle>Launch Readiness</CardTitle>
              <CardDescription>Complete these items before your launch</CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              readinessScore.completed === readinessScore.total
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : ""
            }
          >
            {readinessScore.completed}/{readinessScore.total}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {readinessGroups.map((group) => (
              <div key={group.label}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-1.5">
                      {item.status === "complete" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                      ) : item.status === "coming_soon" ? (
                        <Lock className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span
                        className={`text-sm flex-1 ${
                          item.status === "complete"
                            ? "text-foreground"
                            : item.status === "coming_soon"
                            ? "text-muted-foreground/40"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.status === "incomplete" && item.href && (
                        <Link href={item.href}>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary">
                            Fix <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Wallets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Wallets</CardTitle>
            <Link href={`/projects/${projectId}/whitelist`}>
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentWallets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Your list is clean.{" "}
                <Link href={`/projects/${projectId}/whitelist`} className="text-primary hover:underline">
                  Time to fill it
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {recentWallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <code className="text-sm font-mono">
                        {wallet.address.length > 20
                          ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}`
                          : wallet.address}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={wallet.category as "wl" | "gtd" | "og" | "team" | "fcfs"}>
                        {wallet.category.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Link */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Activity Log</CardTitle>
            <Link href={`/projects/${projectId}/activity`}>
              <Button variant="ghost" size="sm" className="gap-1">
                View Full Log <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6">
              <ScrollText className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Every wallet add, removal, application review, and setting change is permanently recorded.
              </p>
              <Link href={`/projects/${projectId}/activity`} className="mt-4">
                <Button variant="outline" size="sm" className="gap-2">
                  <ScrollText className="h-3.5 w-3.5" /> View Audit Trail
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
