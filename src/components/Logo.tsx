import { cn } from "@/lib/utils";
import logoSrc from "@/assets/beitak-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

// Width-based sizing preserves aspect ratio (h-auto).
// nav: ~90px mobile / ~120px desktop, footer ~100px, hero ~140 mobile / ~180 desktop.
const sizeMap: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "w-[80px]",
  md: "w-[90px] sm:w-[120px]",
  lg: "w-[100px]",
  xl: "w-[140px] sm:w-[180px]",
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
