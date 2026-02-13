"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Upload,
  Download,
  Search,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { truncateAddress, CATEGORY_LABELS } from "@/lib/utils";
import { validateWalletAddress, detectChain, parseCSVWallets } from "@/lib/validators/wallet";
import { logActivity } from "@/lib/audit";
import type { Wallet, WalletCategory, Chain, Project } from "@/types/database";

const categoryOptions = [
  { value: "", label: "All Categories" },
  { value: "wl", label: "WL" },
  { value: "gtd", label: "GTD" },
  { value: "og", label: "OG" },
  { value: "team", label: "Team" },
  { value: "fcfs", label: "FCFS" },
];

const chainOptions = [
  { value: "ethereum", label: "Ethereum" },
  { value: "solana", label: "Solana" },
  { value: "bitcoin", label: "Bitcoin" },
  { value: "polygon", label: "Polygon" },
  { value: "base", label: "Base" },
  { value: "other", label: "Other" },
];

export default function WhitelistPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [addAddress, setAddAddress] = useState("");
  const [addChain, setAddChain] = useState<Chain>("ethereum");
  const [addCategory, setAddCategory] = useState<WalletCategory>("wl");
  const [addLabel, setAddLabel] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<
    { address: string; chain: string; category: string; label: string; valid: boolean; error?: string }[]
  >([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ added: number; skipped: number; errors: number } | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isLocked = project?.is_locked ?? false;

  const loadWallets = useCallback(async () => {
    const supabase = createClient();
    const { data: proj } = await supabase.from("projects").select("*").eq("id", projectId).single();
    setProject(proj as Project);

    let query = supabase.from("wallets").select("*").eq("project_id", projectId).eq("status", "active").order("created_at", { ascending: false });
    if (filterCategory) query = query.eq("category", filterCategory);
    const { data } = await query;
    setWallets((data as Wallet[]) || []);
    setLoading(false);
  }, [projectId, filterCategory]);

  useEffect(() => { loadWallets(); }, [loadWallets]);

  const filteredWallets = wallets.filter((w) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return w.address.toLowerCase().includes(s) || w.label?.toLowerCase().includes(s) || w.category.toLowerCase().includes(s);
  });

  async function handleAddWallet(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;
    setAddError("");
    const validation = validateWalletAddress(addAddress, addChain);
    if (!validation.valid) { setAddError(validation.error || "Invalid address"); return; }

    setAddLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("wallets").insert({
      project_id: projectId, address: addAddress.trim(), chain: addChain, category: addCategory,
      label: addLabel.trim() || null, source: "manual", added_by: user?.id,
    });

    if (error) {
      setAddError(error.code === "23505" ? "This wallet is already on the whitelist" : error.message);
      setAddLoading(false);
      return;
    }

    await logActivity(projectId, "wallet.added", { address: addAddress.trim(), chain: addChain, category: addCategory, label: addLabel.trim() || null });
    setShowAddModal(false); setAddAddress(""); setAddLabel(""); setAddLoading(false);
    loadWallets();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (isLocked) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseCSVWallets(content);
      const preview = parsed.map((item) => {
        const chain = item.chain || (project?.chain ?? "ethereum");
        const validation = validateWalletAddress(item.address, chain as Chain);
        return { address: item.address, chain, category: item.category || "wl", label: item.label || "", valid: validation.valid, error: validation.error };
      });
      setUploadPreview(preview); setShowUploadModal(true); setUploadResult(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleBulkUpload() {
    if (isLocked) return;
    setUploadLoading(true);
    const validWallets = uploadPreview.filter((w) => w.valid);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let added = 0, skipped = 0;
    const errors = uploadPreview.length - validWallets.length;

    for (const wallet of validWallets) {
      const { error } = await supabase.from("wallets").insert({
        project_id: projectId, address: wallet.address.trim(), chain: wallet.chain,
        category: wallet.category, label: wallet.label || null, source: "csv_upload", added_by: user?.id,
      });
      if (error) skipped++; else added++;
    }

    await logActivity(projectId, "wallet.bulk_upload", { added, skipped, errors, total: uploadPreview.length });
    setUploadResult({ added, skipped, errors }); setUploadLoading(false); loadWallets();
  }

  function handleExport() {
    const data = filteredWallets.map((w) => ({ address: w.address, chain: w.chain, category: w.category, label: w.label || "" }));
    const header = "address,chain,category,label";
    const rows = data.map((d) => `${d.address},${d.chain},${d.category},${d.label}`);
    const content = [header, ...rows].join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${project?.name || "whitelist"}-wallets.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteSelected() {
    if (selected.size === 0 || isLocked) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("wallets").update({ status: "removed", removed_at: new Date().toISOString(), removed_by: user?.id }).in("id", Array.from(selected));
    const removedAddresses = filteredWallets.filter((w) => selected.has(w.id)).map((w) => truncateAddress(w.address, 6));
    await logActivity(projectId, "wallet.removed", { count: selected.size, addresses: removedAddresses });
    setSelected(new Set()); loadWallets();
  }

  function toggleSelect(id: string) { setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  function toggleSelectAll() { if (selected.size === filteredWallets.length) setSelected(new Set()); else setSelected(new Set(filteredWallets.map((w) => w.id))); }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {isLocked && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-5 py-4">
          <ShieldCheck className="h-5 w-5 text-green-400 lock-pulse" />
          <div className="flex-1">
            <div className="text-sm font-medium text-green-400">Whitelist is fortified</div>
            <div className="text-xs text-muted-foreground">
              Locked {project?.locked_at ? new Date(project.locked_at).toLocaleString() : ""} &middot; {wallets.length} wallets secured
            </div>
          </div>
          <Badge variant="accepted" className="gap-1"><Lock className="h-3 w-3" /> Locked</Badge>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Whitelist</h1>
          <p className="text-muted-foreground">{wallets.length} wallet{wallets.length !== 1 ? "s" : ""} on the list</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileSelect} className="hidden" />
          {!isLocked && (
            <>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2"><Upload className="h-3.5 w-3.5" /> Import Wallets</Button>
              <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-2"><Plus className="h-3.5 w-3.5" /> Add Wallet</Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2"><Download className="h-3.5 w-3.5" /> Export</Button>
        </div>
      </div>

      {project && (project.wl_spots_total > 0 || project.gtd_spots_total > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {project.wl_spots_total > 0 && (
            <Card><CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">WL Spots</span><span className="text-sm text-muted-foreground">{project.wl_spots_filled} / {project.wl_spots_total}</span></div>
              <div className="h-2 rounded-full bg-secondary"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (project.wl_spots_filled / project.wl_spots_total) * 100)}%` }} /></div>
            </CardContent></Card>
          )}
          {project.gtd_spots_total > 0 && (
            <Card><CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">GTD Spots</span><span className="text-sm text-muted-foreground">{project.gtd_spots_filled} / {project.gtd_spots_total}</span></div>
              <div className="h-2 rounded-full bg-secondary"><div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${Math.min(100, (project.gtd_spots_filled / project.gtd_spots_total) * 100)}%` }} /></div>
            </CardContent></Card>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search wallets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
        <Select options={categoryOptions} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-40" />
        {selected.size > 0 && !isLocked && (<Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="gap-2"><Trash2 className="h-3.5 w-3.5" /> Remove ({selected.size})</Button>)}
      </div>

      <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-secondary/30">
        {!isLocked && <th className="w-10 p-3"><input type="checkbox" checked={selected.size === filteredWallets.length && filteredWallets.length > 0} onChange={toggleSelectAll} className="rounded" /></th>}
        <th className="p-3 text-left font-medium text-muted-foreground">Address</th><th className="p-3 text-left font-medium text-muted-foreground">Chain</th><th className="p-3 text-left font-medium text-muted-foreground">Category</th><th className="p-3 text-left font-medium text-muted-foreground">Label</th><th className="p-3 text-left font-medium text-muted-foreground">Source</th><th className="p-3 text-left font-medium text-muted-foreground">Added</th>
      </tr></thead><tbody>
        {filteredWallets.length === 0 ? (
          <tr><td colSpan={isLocked ? 6 : 7} className="p-8 text-center text-muted-foreground">{wallets.length === 0 ? "Your list is clean. Time to fill it." : "No wallets match your search."}</td></tr>
        ) : filteredWallets.map((wallet) => (
          <tr key={wallet.id} className="border-b transition-colors hover:bg-secondary/20">
            {!isLocked && <td className="p-3"><input type="checkbox" checked={selected.has(wallet.id)} onChange={() => toggleSelect(wallet.id)} className="rounded" /></td>}
            <td className="p-3"><code className="font-mono text-xs">{truncateAddress(wallet.address, 8)}</code></td>
            <td className="p-3"><Badge variant={wallet.chain as "ethereum" | "solana" | "bitcoin" | "polygon" | "base"}>{wallet.chain}</Badge></td>
            <td className="p-3"><Badge variant={wallet.category as "wl" | "gtd" | "og" | "team" | "fcfs"}>{CATEGORY_LABELS[wallet.category]}</Badge></td>
            <td className="p-3 text-muted-foreground">{wallet.label || "\u2014"}</td>
            <td className="p-3 text-muted-foreground capitalize">{wallet.source.replace("_", " ")}</td>
            <td className="p-3 text-muted-foreground">{new Date(wallet.created_at).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody></table></div></CardContent></Card>

      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)}>
        <DialogHeader><DialogTitle>Add Wallet</DialogTitle><DialogDescription>Add a wallet to the whitelist. Address will be validated.</DialogDescription></DialogHeader>
        <form onSubmit={handleAddWallet} className="space-y-4">
          {addError && <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" /> {addError}</div>}
          <div className="space-y-2"><label className="text-sm font-medium">Wallet Address *</label><Input placeholder="0x... or base58 address" value={addAddress} onChange={(e) => { setAddAddress(e.target.value); const detected = detectChain(e.target.value); if (detected) setAddChain(detected); }} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Chain</label><Select options={chainOptions} value={addChain} onChange={(e) => setAddChain(e.target.value as Chain)} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Category</label><Select options={categoryOptions.filter((o) => o.value)} value={addCategory} onChange={(e) => setAddCategory(e.target.value as WalletCategory)} /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">Label (optional)</label><Input placeholder="e.g. collab with DeGods" value={addLabel} onChange={(e) => setAddLabel(e.target.value)} /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button><Button type="submit" disabled={addLoading}>{addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Wallet"}</Button></div>
        </form>
      </Dialog>

      <Dialog open={showUploadModal} onClose={() => setShowUploadModal(false)}>
        <DialogHeader><DialogTitle>Import Preview</DialogTitle><DialogDescription>Review {uploadPreview.length} wallet{uploadPreview.length !== 1 ? "s" : ""} before adding</DialogDescription></DialogHeader>
        {uploadResult ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-400"><CheckCircle2 className="h-4 w-4" /> {uploadResult.added} added successfully</div>
              {uploadResult.skipped > 0 && <div className="flex items-center gap-2 text-yellow-400"><AlertCircle className="h-4 w-4" /> {uploadResult.skipped} skipped (duplicates)</div>}
              {uploadResult.errors > 0 && <div className="flex items-center gap-2 text-red-400"><X className="h-4 w-4" /> {uploadResult.errors} invalid addresses</div>}
            </div>
            <Button className="w-full" onClick={() => setShowUploadModal(false)}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto rounded-lg border"><table className="w-full text-xs"><thead><tr className="border-b bg-secondary/30"><th className="p-2 text-left">Status</th><th className="p-2 text-left">Address</th><th className="p-2 text-left">Chain</th><th className="p-2 text-left">Category</th></tr></thead><tbody>
              {uploadPreview.map((item, i) => (<tr key={i} className="border-b"><td className="p-2">{item.valid ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <AlertCircle className="h-3.5 w-3.5 text-red-400" />}</td><td className="p-2 font-mono">{truncateAddress(item.address, 6)}{!item.valid && <div className="text-red-400 mt-0.5">{item.error}</div>}</td><td className="p-2">{item.chain}</td><td className="p-2 uppercase">{item.category}</td></tr>))}
            </tbody></table></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{uploadPreview.filter((w) => w.valid).length} valid, {uploadPreview.filter((w) => !w.valid).length} invalid</span></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button><Button onClick={handleBulkUpload} disabled={uploadLoading || uploadPreview.filter((w) => w.valid).length === 0}>{uploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Add ${uploadPreview.filter((w) => w.valid).length} Wallets`}</Button></div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
