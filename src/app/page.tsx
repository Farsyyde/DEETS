import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Lock,
  ScrollText,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    icon: ScrollText,
    title: "Verified Whitelists",
    description:
      "Every wallet validated. Every addition logged. Every change recorded. Your whitelist is an audit trail, not a spreadsheet.",
  },
  {
    icon: Lock,
    title: "Timeline Integrity",
    description:
      "Set your dates. Lock your list. Your community sees the same truth you do. Date changes are permanently recorded.",
  },
  {
    icon: Search,
    title: "Public Proof",
    description:
      "Give your holders a link to check their status. No DMs. No guessing. No drama. Lock status and timestamps visible to everyone.",
  },
];

const chains = [
  { name: "Ethereum", color: "#627eea" },
  { name: "Solana", color: "#9945ff" },
  { name: "Bitcoin", color: "#f7931a" },
  { name: "Polygon", color: "#8247e5" },
  { name: "Base", color: "#0052ff" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Image src="/DEETS_logo.png" alt="DEETS" width={120} height={40} className="h-8 w-auto" />
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Set Up Your Launch</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/10 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-primary" />
            Trust infrastructure for launches
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Everything your launch
            <br />needs in <span className="text-primary">one place</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Structured whitelist management. Verifiable process. Community trust.
            Your launch deserves better than a spreadsheet.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Set Up Your Launch <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Log In
              </Button>
            </Link>
          </div>
          {/* Chain badges */}
          <div className="mt-12 flex items-center justify-center gap-3 flex-wrap">
            {chains.map((chain) => (
              <div
                key={chain.name}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/30 px-3 py-1.5 text-sm"
              >
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chain.color }} />
                {chain.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Three things that protect your launch
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Communities don&apos;t revolt because whitelists are hard to manage.
              They revolt because whitelists are opaque. DEETS solves opacity.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="glow-card rounded-xl border bg-card p-8 transition-colors hover:border-primary/30"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <pillar.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-3 text-lg font-semibold">{pillar.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 border-t">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl mb-16">
            From setup to snapshot
          </h2>
          <div className="space-y-8">
            {[
              { step: "01", title: "Create your launch room", desc: "Name, chain, timeline dates, spot allocations. Everything in one place." },
              { step: "02", title: "Build your whitelist", desc: "Add wallets manually or import via CSV. Every addition is logged with timestamp and actor." },
              { step: "03", title: "Review applications", desc: "Open a public application form. Approve or reject with one click. Approved wallets are added automatically." },
              { step: "04", title: "Lock and verify", desc: "Lock your whitelist when ready. Your community sees the lock timestamp. No wallets can be added or removed until you unlock." },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary font-mono">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="rounded-2xl border bg-card p-12">
            <Image src="/DEETS_logo.png" alt="DEETS" width={180} height={60} className="mx-auto mb-6 h-12 w-auto" />
            <h2 className="text-3xl font-bold tracking-tight">
              Your launch deserves better than a spreadsheet.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built for founders who protect their community.
            </p>
            <Link href="/register">
              <Button size="lg" className="mt-8 gap-2">
                Set Up Your Launch <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between text-sm text-muted-foreground">
          <Image src="/DEETS_logo.png" alt="DEETS" width={80} height={28} className="h-5 w-auto" />
          <p>Trust infrastructure for digital asset launches</p>
        </div>
      </footer>
    </div>
  );
}
