"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, CheckCircle2, XCircle, Loader2, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { CHAIN_LABELS, CATEGORY_LABELS, formatDate } from "@/lib/utils";
import type { Project, Wallet } from "@/types/database";

export default function CheckPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<{ found: boolean; wallet?: Wallet } | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .single();
      setProject(data as Project);
      setLoading(false);
    }
    load();
  }, [slug]);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim() || !project) return;

    setChecking(true);
    setResult(null);

    const supabase = createClient();
    const { data } = await supabase
      .from("wallets")
      .select("*")
      .eq("project_id", project.id)
      .eq("status", "active")
      .ilike("address", address.trim())
      .limit(1);

    const walletList = (data as Wallet[]) || [];
    setResult({
      found: walletList.length > 0,
      wallet: walletList[0] || undefined,
    });
    setChecking(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b bg-card/50 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <Link href="/">
            <Image src="/DEETS_logo.png" alt="DEETS" width={100} height={34} className="h-6 w-auto" />
          </Link>
          <Link href={`/p/${slug}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" /> {project.name}
            </Button>
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-lg px-6 py-12">
        {/* Lock Status Context */}
        {project.is_locked && project.locked_at && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/5 border border-green-500/10 px-4 py-3 mb-6">
            <Lock className="h-4 w-4 text-green-400 shrink-0" />
            <p className="text-xs text-green-400">
              Whitelist finalized on {formatDate(project.locked_at)}. This list is locked and verified.
            </p>
          </div>
        )}

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
              {project.name.charAt(0).toUpperCase()}
            </div>
            <CardTitle>Whitelist Checker</CardTitle>
            <CardDescription>
              Check if your wallet is on the {project.name} whitelist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCheck} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Enter your wallet address..."
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setResult(null);
                  }}
                  className="pl-10"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={checking}>
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check Whitelist"}
              </Button>
            </form>

            {result && (
              <div className="mt-6">
                {result.found ? (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-center">
                    <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-green-400" />
                    <h3 className="font-semibold text-green-400">You&apos;re on the list.</h3>
                    {result.wallet && (
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <Badge
                          variant={result.wallet.category as "wl" | "gtd" | "og" | "team" | "fcfs"}
                        >
                          {CATEGORY_LABELS[result.wallet.category]}
                        </Badge>
                        <Badge
                          variant={result.wallet.chain as "ethereum" | "solana" | "bitcoin"}
                        >
                          {CHAIN_LABELS[result.wallet.chain]}
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-center">
                    <XCircle className="mx-auto mb-2 h-10 w-10 text-red-400" />
                    <h3 className="font-semibold text-red-400">This wallet is not on the list.</h3>
                    {project.is_applications_open && !project.is_locked && (
                      <Link href={`/p/${slug}/apply`} className="mt-3 inline-block">
                        <Button variant="outline" size="sm">
                          Apply for a spot
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
