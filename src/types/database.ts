export type Chain = "ethereum" | "solana" | "bitcoin" | "polygon" | "base" | "other";
export type WalletCategory = "wl" | "gtd" | "og" | "team" | "fcfs";
export type WalletSource = "manual" | "csv_upload" | "collab" | "application";
export type WalletStatus = "active" | "removed";
export type CollabStatus = "pending" | "accepted" | "declined" | "completed";
export type ApplicationStatus = "pending" | "approved" | "rejected";

export type ActivityAction =
  | "wallet.added"
  | "wallet.removed"
  | "wallet.bulk_upload"
  | "list.locked"
  | "list.unlocked"
  | "application.approved"
  | "application.rejected"
  | "collab.sent"
  | "collab.accepted"
  | "collab.declined"
  | "project.updated"
  | "project.created"
  | "timeline.changed";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  wallet_chain: Chain | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  chain: Chain;
  logo_url: string | null;
  banner_url: string | null;
  twitter_url: string | null;
  discord_url: string | null;
  website_url: string | null;
  marketplace_url: string | null;
  mint_date: string | null;
  supply: number | null;
  mint_price: string | null;
  wl_spots_total: number;
  wl_spots_filled: number;
  gtd_spots_total: number;
  gtd_spots_filled: number;
  is_applications_open: boolean;
  is_locked: boolean;
  locked_at: string | null;
  locked_by: string | null;
  wl_open_date: string | null;
  wl_close_date: string | null;
  snapshot_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  project_id: string;
  address: string;
  chain: Chain;
  category: WalletCategory;
  label: string | null;
  source: WalletSource;
  status: WalletStatus;
  added_by: string;
  created_at: string;
  removed_at: string | null;
  removed_by: string | null;
}

export interface Collaboration {
  id: string;
  requester_project_id: string;
  target_project_id: string;
  status: CollabStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  requester_project?: Project;
  target_project?: Project;
}

export interface WhitelistApplication {
  id: string;
  project_id: string;
  wallet_address: string;
  wallet_chain: Chain;
  twitter_handle: string | null;
  discord_handle: string | null;
  reason: string | null;
  status: ApplicationStatus;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface ActivityLog {
  id: string;
  project_id: string;
  actor_id: string;
  action: ActivityAction;
  details: Record<string, unknown> | null;
  created_at: string;
}

// Launch Readiness Framework
// MVP: all items are computed from existing Project fields
// Future: DB-backed items via a `readiness_checks` table

export type ReadinessCategory = "whitelist" | "timeline" | "profile" | "assets" | "contract" | "distribution";

export type ReadinessStatus = "complete" | "incomplete" | "coming_soon";

export interface ReadinessItem {
  id: string;
  label: string;
  category: ReadinessCategory;
  status: ReadinessStatus;
  href?: string;
  description?: string;
}
