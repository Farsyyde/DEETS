import type { Project, ReadinessItem } from "@/types/database";

/**
 * Computes launch readiness items from existing project data.
 *
 * MVP: All items are derived from Project fields — no DB calls needed.
 * Future: This function will merge computed items with DB-backed
 * readiness_checks results (metadata validation, asset checks, etc.).
 */
export function computeReadiness(project: Project, projectId: string): ReadinessItem[] {
  const items: ReadinessItem[] = [
    // Whitelist & Timeline (live — computed from project fields)
    {
      id: "project-configured",
      label: "Project configured",
      category: "whitelist",
      status: project.name && project.chain ? "complete" : "incomplete",
      href: `/projects/${projectId}/settings`,
      description: "Name, chain, and basic info set",
    },
    {
      id: "timeline-set",
      label: "Timeline set",
      category: "timeline",
      status: project.wl_open_date && project.mint_date ? "complete" : "incomplete",
      href: `/projects/${projectId}/settings`,
      description: "WL open date and mint date configured",
    },
    {
      id: "whitelist-populated",
      label: "Whitelist populated",
      category: "whitelist",
      status: project.wl_spots_filled > 0 ? "complete" : "incomplete",
      href: `/projects/${projectId}/whitelist`,
      description: "At least one wallet added to the list",
    },
    {
      id: "spots-allocated",
      label: "Spot allocations defined",
      category: "whitelist",
      status: project.wl_spots_total > 0 ? "complete" : "incomplete",
      href: `/projects/${projectId}/settings`,
      description: "Total WL spots configured",
    },
    {
      id: "social-links",
      label: "Social links added",
      category: "profile",
      status:
        project.twitter_url || project.discord_url || project.website_url
          ? "complete"
          : "incomplete",
      href: `/projects/${projectId}/settings`,
      description: "At least one social link connected",
    },
    {
      id: "whitelist-locked",
      label: "Whitelist locked",
      category: "whitelist",
      status: project.is_locked ? "complete" : "incomplete",
      href: `/projects/${projectId}/settings`,
      description: "List finalized and visible to community",
    },

    // Coming Soon (future features — displayed for positioning)
    {
      id: "metadata-validated",
      label: "Metadata validated",
      category: "assets",
      status: "coming_soon",
      description: "Token metadata format and completeness check",
    },
    {
      id: "art-organized",
      label: "Art assets organized",
      category: "assets",
      status: "coming_soon",
      description: "Image layers and trait files structured",
    },
    {
      id: "trait-verified",
      label: "Trait file verified",
      category: "assets",
      status: "coming_soon",
      description: "Trait rarity and distribution validated",
    },
    {
      id: "contract-uri",
      label: "Contract URI set",
      category: "contract",
      status: "coming_soon",
      description: "Base URI and reveal URI configured",
    },
    {
      id: "marketplace-compat",
      label: "Marketplace compatibility",
      category: "distribution",
      status: "coming_soon",
      description: "OpenSea, Magic Eden, and marketplace standards met",
    },
  ];

  return items;
}

/**
 * Calculates readiness score from live items only.
 * "Coming soon" items are excluded from the count.
 */
export function getReadinessScore(items: ReadinessItem[]): {
  completed: number;
  total: number;
} {
  const liveItems = items.filter((item) => item.status !== "coming_soon");
  const completed = liveItems.filter((item) => item.status === "complete").length;
  return { completed, total: liveItems.length };
}
