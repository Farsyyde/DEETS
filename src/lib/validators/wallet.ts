import type { Chain } from "@/types/database";

const ETH_REGEX = /^0x[a-fA-F0-9]{40}$/;
const SOL_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const BTC_TAPROOT_REGEX = /^bc1p[a-zA-HJ-NP-Z0-9]{58}$/;
const BTC_LEGACY_REGEX = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/;

export function validateWalletAddress(
  address: string,
  chain: Chain
): { valid: boolean; error?: string } {
  const trimmed = address.trim();

  if (!trimmed) {
    return { valid: false, error: "Address is empty" };
  }

  switch (chain) {
    case "ethereum":
    case "polygon":
    case "base":
      if (!ETH_REGEX.test(trimmed)) {
        return {
          valid: false,
          error: "Invalid EVM address. Must start with 0x followed by 40 hex characters",
        };
      }
      return { valid: true };

    case "solana":
      if (!SOL_REGEX.test(trimmed)) {
        return {
          valid: false,
          error: "Invalid Solana address. Must be a base58 string (32-44 characters)",
        };
      }
      return { valid: true };

    case "bitcoin":
      if (!BTC_TAPROOT_REGEX.test(trimmed) && !BTC_LEGACY_REGEX.test(trimmed)) {
        return {
          valid: false,
          error: "Invalid Bitcoin address",
        };
      }
      return { valid: true };

    case "other":
      if (trimmed.length < 10) {
        return { valid: false, error: "Address seems too short" };
      }
      return { valid: true };

    default:
      return { valid: true };
  }
}

export function detectChain(address: string): Chain | null {
  const trimmed = address.trim();
  if (ETH_REGEX.test(trimmed)) return "ethereum";
  if (SOL_REGEX.test(trimmed)) return "solana";
  if (BTC_TAPROOT_REGEX.test(trimmed) || BTC_LEGACY_REGEX.test(trimmed)) return "bitcoin";
  return null;
}

export function parseCSVWallets(
  csvContent: string
): { address: string; chain?: string; category?: string; label?: string }[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length === 0) return [];

  const firstLine = lines[0].toLowerCase();
  const hasHeader =
    firstLine.includes("address") ||
    firstLine.includes("wallet") ||
    firstLine.includes("chain");

  const startIndex = hasHeader ? 1 : 0;
  const results: { address: string; chain?: string; category?: string; label?: string }[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts[0]) {
      results.push({
        address: parts[0],
        chain: parts[1] || undefined,
        category: parts[2] || undefined,
        label: parts[3] || undefined,
      });
    }
  }

  return results;
}
