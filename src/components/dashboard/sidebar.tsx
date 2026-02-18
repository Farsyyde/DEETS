"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Wallet,
  Handshake,
  ClipboardList,
  ScrollText,
  Settings,
  Plus,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/database";

interface SidebarProps {
  projects: Project[];
  currentProjectId?: string;
  onSignOut: () => void;
}

export function Sidebar({ projects, currentProjectId, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const currentProject = projects.find((p) => p.id === currentProjectId);

  const navItems = currentProjectId
    ? [
        { href: `/projects/${currentProjectId}`, icon: LayoutDashboard, label: "Overview" },
        { href: `/projects/${currentProjectId}/whitelist`, icon: Wallet, label: "Whitelist" },
        { href: `/projects/${currentProjectId}/collabs`, icon: Handshake, label: "Collabs" },
        { href: `/projects/${currentProjectId}/applications`, icon: ClipboardList, label: "Applications" },
        { href: `/projects/${currentProjectId}/activity`, icon: ScrollText, label: "Activity Log" },
        { href: `/projects/${currentProjectId}/settings`, icon: Settings, label: "Settings" },
      ]
    : [];

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card/50">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Image src="/deets_logo2.png" alt="DEETS" width={110} height={36} className="h-7 w-auto" />
      </div>

      {/* Project Switcher */}
      <div className="border-b p-3">
        <div className="group relative">
          <button className="flex w-full items-center gap-3 rounded-lg bg-secondary/50 p-3 text-left text-sm transition-colors hover:bg-secondary">
            {currentProject ? (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {currentProject.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="truncate font-medium">{currentProject.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{currentProject.chain}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </>
            ) : (
              <span className="text-muted-foreground">Select a project</span>
            )}
          </button>
          {/* Dropdown */}
          <div className="invisible absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-card shadow-xl group-focus-within:visible">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-secondary first:rounded-t-lg last:rounded-b-lg",
                  project.id === currentProjectId && "bg-secondary"
                )}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{project.name}</span>
              </Link>
            ))}
            <Link
              href="/projects/new"
              className="flex items-center gap-3 border-t px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              New Launch
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary",
            pathname === "/dashboard" && "bg-secondary text-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        {navItems.length > 0 && (
          <>
            <div className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Project
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary",
                  pathname === item.href && "bg-secondary text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Sign Out */}
      <div className="border-t p-3">
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
