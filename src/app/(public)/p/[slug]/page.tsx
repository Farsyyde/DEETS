import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ExternalLink,
  Users,
  Calendar,
  Coins,
  Layers,
  ArrowRight,
  Search,
  ClipboardList,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { CHAIN_LABELS, formatDate, formatNumber } from "@/lib/utils";

export default async function PublicProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!project) notFound();

  const { count: walletCount } = await supabase
    .from("wallets")
    .select("*", { count: "exact", head: true })
    .eq("project_id", project.id)
    .eq("status", "active");

  const timelineItems = [
    { label: "WL Opens", date: project.wl_open_date },
    { label: "WL Closes", date: project.wl_close_date },
    { label: "Snapshot", date: project.snapshot_date },
    { label: "Mint", date: project.mint_date },
  ].filter((t: { label: string; date: string | null }) => t.date);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b bg-card/50 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <Link href="/">
            <Image src="/deets_logo2.png" alt="DEETS" width={100} height={34} className="h-6 w-auto" />
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={project.chain as "ethereum" | "solana" | "bitcoin" | "polygon" | "base"}>
                  {CHAIN_LABELS[project.chain] || project.chain}
                </Badge>
                {project.is_locked ? (
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20 gap-1">
                    <Lock className="h-3 w-3" /> Whitelist Finalized
                  </Badge>
                ) : project.is_applications_open ? (
                  <Badge variant="accepted">Applications Open</Badge>
                ) : null}
              </div>
            </div>
          </div>
          {project.description && (
            <p className="text-muted-foreground max-w-2xl">{project.description}</p>
          )}
        </div>

        {/* Lock Status Banner */}
        {project.is_locked && project.locked_at && (
          <div className="flex items-center gap-3 rounded-lg bg-green-500/5 border border-green-500/10 px-4 py-3 mb-8">
            <Lock className="h-5 w-5 text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-400">Whitelist finalized</p>
              <p className="text-xs text-muted-foreground">
                Locked on {formatDate(project.locked_at)}. {formatNumber(walletCount || 0)} wallets secured. No further changes can be made.
              </p>
            </div>
          </div>
        )}

        {/* Links */}
        {(project.twitter_url || project.discord_url || project.website_url || project.marketplace_url) && (
          <div className="flex gap-3 flex-wrap mb-8">
            {project.twitter_url && (
              <a href={project.twitter_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  Twitter/X <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
            {project.discord_url && (
              <a href={project.discord_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  Discord <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
            {project.website_url && (
              <a href={project.website_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  Website <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
            {project.marketplace_url && (
              <a href={project.marketplace_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  Marketplace <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="mx-auto mb-2 h-5 w-5 text-primary" />
              <div className="text-xl font-bold">{formatNumber(walletCount || 0)}</div>
              <div className="text-xs text-muted-foreground">Whitelisted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              {project.is_locked ? (
                <Lock className="mx-auto mb-2 h-5 w-5 text-green-400" />
              ) : (
                <Unlock className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              )}
              <div className="text-xl font-bold">{project.is_locked ? "Locked" : "Open"}</div>
              <div className="text-xs text-muted-foreground">Status</div>
            </CardContent>
          </Card>
          {project.supply && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Layers className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <div className="text-xl font-bold">{formatNumber(project.supply)}</div>
                <div className="text-xs text-muted-foreground">Supply</div>
              </CardContent>
            </Card>
          )}
          {project.mint_price && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Coins className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <div className="text-xl font-bold">{project.mint_price}</div>
                <div className="text-xs text-muted-foreground">Mint Price</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline */}
        {timelineItems.length > 0 && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Timeline</h3>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                {timelineItems.map((item: { label: string; date: string | null }) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{item.label}:</span>
                    <span className="text-sm font-mono">{formatDate(item.date!)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href={`/p/${slug}/check`}>
            <Card className="glow-card transition-colors hover:border-primary/30 cursor-pointer h-full">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Check Whitelist</h3>
                  <p className="text-sm text-muted-foreground">See if your wallet is on the list</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          {project.is_applications_open && !project.is_locked && (
            <Link href={`/p/${slug}/apply`}>
              <Card className="glow-card transition-colors hover:border-primary/30 cursor-pointer h-full">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                    <ClipboardList className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Apply for Whitelist</h3>
                    <p className="text-sm text-muted-foreground">Submit your application for a spot</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
