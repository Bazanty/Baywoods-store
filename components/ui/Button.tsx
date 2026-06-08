import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-mono uppercase tracking-[0.16em] transition-all duration-200 active:translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary: "bg-ink text-cream hover:bg-forest-dark hover:text-citrine",
      outline: "border border-ink text-ink hover:bg-ink hover:text-cream",
      ghost: "text-ink hover:text-citrine",
      danger: "bg-danger text-cream hover:bg-red-800",
    };

    const sizes = {
      sm: "text-[10px] px-4 py-2",
      md: "text-[11px] px-6 py-3.5",
      lg: "text-xs px-8 py-4",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <span className="w-3 h-3 border-2 border-current border-t-transparent animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
