import { cn } from "@/lib/utils";
import logoSrc from "@/assets/beitak-logo.jpg";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero" | "auth";
  /** Kept for backwards compatibility — the same transparent PNG is used everywhere. */
  variant?: "default" | "white";
  className?: string;
}

// Width-based sizing preserves aspect ratio (h-auto).
// Per spec:
//   - hero  : 240px desktop / 160px mobile
//   - md    : navbar — 120px desktop / 90px mobile
//   - lg    : footer — 100px wide
//   - auth  : auth pages — 150px wide
const sizeMap: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "w-[80px]",
  md: "w-[90px] sm:w-[120px]",
  lg: "w-[100px]",
  xl: "w-[160px] sm:w-[240px]",
  hero: "w-[160px] sm:w-[240px]",
  auth: "w-[150px]",
};

export function Logo({ size = "md", className }: LogoProps) {
  return (
    <img
      src={logoSrc}
      alt="BEITAK — Home is closer than you think"
      className={cn(sizeMap[size], "h-auto object-contain", className)}
    />
  );
}
