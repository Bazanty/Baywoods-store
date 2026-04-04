import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "new" | "sale" | "hot" | "low-stock" | "out-of-stock";
  className?: string;
}

const config = {
  new: { label: "New", style: "bg-forest text-white" },
  sale: { label: "Sale", style: "bg-danger text-white" },
  hot: { label: "Hot", style: "bg-ink text-white" },
  "low-stock": { label: "Low Stock", style: "bg-amber-500 text-white" },
  "out-of-stock": { label: "Sold Out", style: "bg-stone text-muted" },
};

export default function Badge({ variant = "new", className }: BadgeProps) {
  const { label, style } = config[variant];
  return (
    <span
      className={cn(
        "inline-block text-[10px] font-sans font-semibold tracking-[0.12em] uppercase px-2 py-0.5",
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
