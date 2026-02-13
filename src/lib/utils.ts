import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const CHAIN_COLORS: Record<string, string> = {
  ethereum: "var(--color-ethereum)",
  solana: "var(--color-solana)",
  bitcoin: "var(--color-bitcoin)",
  polygon: "var(--color-polygon)",
  base: "var(--color-base)",
  other: "#71717a",
};

export const CATEGORY_COLORS: Record<string, string> = {
  gtd: "var(--color-gtd)",
  wl: "var(--color-wl)",
  og: "var(--color-og)",
  team: "var(--color-team)",
  fcfs: "var(--color-fcfs)",
};

export const CATEGORY_LABELS: Record<string, string> = {
  gtd: "GTD",
  wl: "WL",
  og: "OG",
  team: "Team",
  fcfs: "FCFS",
};

export const CHAIN_LABELS: Record<string, string> = {
  ethereum: "Ethereum",
  solana: "Solana",
  bitcoin: "Bitcoin",
  polygon: "Polygon",
  base: "Base",
  other: "Other",
};
