"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Wallet, Handshake, ClipboardList, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { CHAIN_LABELS } from "@/lib/utils";
import type { Project } from "@/types/database";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      setProjects((data as Project[]) || []);
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your launches at a glance</p>
        </div>
        <Link href="/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Launch
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No launches configured yet</h3>
            <p className="mb-6 text-sm text-muted-foreground text-center max-w-sm">
              Set up your first launch to start managing whitelists, timelines, and applications.
            </p>
            <Link href="/projects/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Set Up Your Launch
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="glow-card transition-colors hover:border-primary/30 cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <Badge variant={project.chain as "ethereum" | "solana" | "bitcoin" | "polygon" | "base"}>
                      {CHAIN_LABELS[project.chain] || project.chain}
                    </Badge>
                  </div>
                  <CardTitle className="mt-3">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <Wallet className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                      <div className="text-lg font-bold">{project.wl_spots_filled}</div>
                      <div className="text-xs text-muted-foreground">WL Spots</div>
                    </div>
                    <div>
                      <Handshake className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                      <div className="text-lg font-bold">{project.gtd_spots_filled}</div>
                      <div className="text-xs text-muted-foreground">GTD</div>
                    </div>
                    <div>
                      <ClipboardList className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                      <div className="text-lg font-bold">
                        {project.is_applications_open ? "Open" : "Closed"}
                      </div>
                      <div className="text-xs text-muted-foreground">Apps</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end text-sm text-primary">
                    Manage <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
