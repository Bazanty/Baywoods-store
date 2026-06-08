import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "new" | "sale" | "hot" | "low-stock" | "out-of-stock" | "verified";
  className?: string;
}

const config = {
  new: { label: "New", style: "bg-ink text-citrine" },
  sale: { label: "Sale", style: "bg-citrine text-ink" },
  hot: { label: "Hot", style: "bg-ink text-cream" },
  verified: { label: "Verified", style: "bg-cream text-ink border border-ink" },
  "low-stock": { label: "Low stock", style: "bg-citrine text-ink" },
  "out-of-stock": { label: "Sold out", style: "bg-ink/60 text-cream" },
};

export default function Badge({ variant = "new", className }: BadgeProps) {
  const { label, style } = config[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono text-[10px] font-medium tracking-[0.18em] uppercase px-2 py-0.5",
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
