"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Baywoods brand toggle — vintage brown when OFF, metallic gold when ON.
// No browser/default colors anywhere. Premium soft thumb motion, bronze hover
// glow, gold focus ring, generous tap target.
const BRAND = {
  offTrack: "#2A1A16", // dark chocolate
  offBorder: "#4A2F27", // vintage washed brown
  offThumb: "#F3E8D2", // soft cream
  onTrack: "#B88945", // metallic gold / bronze
  onThumb: "#0B0B0B", // deep black — cleanest contrast on gold
  ring: "#B88945",
} as const;

const SIZES = {
  sm: { track: "w-10 h-[22px]", thumb: 16, travel: 18 },
  md: { track: "w-[52px] h-7", thumb: 22, travel: 24 },
} as const;

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  size?: keyof typeof SIZES;
  id?: string;
  /** Accessible name when there's no visible <label> wired to this control. */
  ariaLabel?: string;
  className?: string;
}

export default function Switch({
  checked,
  onChange,
  disabled = false,
  size = "md",
  id,
  ariaLabel,
  className,
}: SwitchProps) {
  const { track, thumb, travel } = SIZES[size];

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        // Tap target stays comfortable on mobile even with a compact track.
        "relative inline-flex shrink-0 items-center rounded-full border px-[3px] align-middle",
        "touch-manipulation transition-[background-color,border-color,box-shadow] duration-300 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "hover:brightness-110 hover:shadow-[0_0_14px_rgba(184,137,69,0.55)]"
          : "hover:shadow-[0_0_12px_rgba(184,137,69,0.28)]",
        track,
        className
      )}
      style={{
        backgroundColor: checked ? BRAND.onTrack : BRAND.offTrack,
        borderColor: checked ? BRAND.onTrack : BRAND.offBorder,
        // Inline custom props so the gold ring/offset never fall back to a
        // Tailwind default.
        ["--tw-ring-color" as string]: BRAND.ring,
        ["--tw-ring-offset-color" as string]: BRAND.offTrack,
      }}
    >
      <motion.span
        className="block rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
        style={{ width: thumb, height: thumb }}
        animate={{
          x: checked ? travel : 0,
          backgroundColor: checked ? BRAND.onThumb : BRAND.offThumb,
        }}
        transition={{ type: "spring", stiffness: 480, damping: 34, mass: 0.6 }}
      />
    </button>
  );
}
