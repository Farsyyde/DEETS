import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        gtd: "border-transparent bg-green-500/20 text-green-400",
        wl: "border-transparent bg-violet-500/20 text-violet-400",
        og: "border-transparent bg-amber-500/20 text-amber-400",
        team: "border-transparent bg-blue-500/20 text-blue-400",
        fcfs: "border-transparent bg-pink-500/20 text-pink-400",
        ethereum: "border-transparent bg-[#627eea]/20 text-[#627eea]",
        solana: "border-transparent bg-[#9945ff]/20 text-[#9945ff]",
        bitcoin: "border-transparent bg-[#f7931a]/20 text-[#f7931a]",
        polygon: "border-transparent bg-[#8247e5]/20 text-[#8247e5]",
        base: "border-transparent bg-[#0052ff]/20 text-[#0052ff]",
        pending: "border-transparent bg-yellow-500/20 text-yellow-400",
        accepted: "border-transparent bg-green-500/20 text-green-400",
        declined: "border-transparent bg-red-500/20 text-red-400",
        completed: "border-transparent bg-blue-500/20 text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
