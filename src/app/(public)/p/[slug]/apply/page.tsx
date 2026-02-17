"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { validateWalletAddress, detectChain } from "@/lib/validators/wallet";
import { CHAIN_LABELS } from "@/lib/utils";
import type { Project, Chain } from "@/types/database";

const chainOptions = [
  { value: "ethereum", label: "Ethereum" },
  { value: "solana", label: "Solana" },
  { value: "bitcoin", label: "Bitcoin" },
  { value: "polygon", label: "Polygon" },
  { value: "base", label: "Base" },
  { value: "other", label: "Other" },
];

export default function ApplyPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [walletAddress, setWalletAddress] = useState("");
  const [walletChain, setWalletChain] = useState<Chain>("ethereum");
  const [twitter, setTwitter] = useState("");
  const [discord, setDiscord] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .single();
      setProject(data as Project);
      if (data) {
        setWalletChain(data.chain as Chain);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validation = validateWalletAddress(walletAddress, walletChain);
    if (!validation.valid) {
      setError(validation.error || "Invalid wallet address");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("whitelist_applications").insert({
      project_id: project!.id,
      wallet_address: walletAddress.trim(),
      wallet_chain: walletChain,
      twitter_handle: twitter.trim().replace("@", "") || null,
      discord_handle: discord.trim() || null,
      reason: reason.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
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

  if (!project.is_applications_open) {
    return (
      <div className="min-h-screen">
        <nav className="border-b bg-card/50">
          <div className="mx-auto flex h-14 max-w-4xl items-center px-6">
            <Link href="/">
              <Image src="/DEETS_logo.png" alt="DEETS" width={100} height={34} className="h-6 w-auto" />
            </Link>
          </div>
        </nav>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-bold mb-2">Applications Closed</h2>
          <p className="text-muted-foreground mb-4">
            {project.name} is not accepting WL applications right now.
          </p>
          <Link href={`/p/${slug}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Project
            </Button>
          </Link>
        </div>
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
        {submitted ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <CheckCircle2 className="mb-4 h-16 w-16 text-green-400" />
              <h2 className="mb-2 text-xl font-bold">Application Submitted!</h2>
              <p className="text-center text-muted-foreground max-w-sm">
                Your whitelist application for {project.name} has been submitted. The team will review it and add your wallet if approved.
              </p>
              <Link href={`/p/${slug}`} className="mt-6">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle>Apply for Whitelist</CardTitle>
                  <CardDescription>{project.name}</CardDescription>
                </div>
                <Badge variant={project.chain as "ethereum" | "solana"} className="ml-auto">
                  {CHAIN_LABELS[project.chain]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Wallet Address *</label>
                  <Input
                    placeholder="Your wallet address"
                    value={walletAddress}
                    onChange={(e) => {
                      setWalletAddress(e.target.value);
                      const detected = detectChain(e.target.value);
                      if (detected) setWalletChain(detected);
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Chain</label>
                  <Select
                    options={chainOptions}
                    value={walletChain}
                    onChange={(e) => setWalletChain(e.target.value as Chain)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Twitter/X Handle</label>
                    <Input
                      placeholder="@yourhandle"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Discord Username</label>
                    <Input
                      placeholder="user#1234"
                      value={discord}
                      onChange={(e) => setDiscord(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Why should you get WL?</label>
                  <Textarea
                    placeholder="Tell the team why you deserve a whitelist spot..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Application"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
