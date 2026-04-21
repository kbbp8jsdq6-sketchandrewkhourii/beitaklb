import { cn } from "@/lib/utils";
import logoSrc from "@/assets/beitak-logo.png";
import logoWhiteSrc from "@/assets/beitak-logo-white.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white";
  className?: string;
}

// Width-based sizing preserves aspect ratio (h-auto).
// nav: ~90px mobile / ~120px desktop, footer ~100px, hero ~140 mobile / ~180 desktop.
const sizeMap: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "w-[80px]",
  md: "w-[90px] sm:w-[120px]",
  lg: "w-[100px]",
  xl: "w-[220px] sm:w-[300px]",
};

export function Logo({ size = "md", variant = "default", className }: LogoProps) {
  const src = variant === "white" ? logoWhiteSrc : logoSrc;
  return (
    <img
      src={src}
      alt="BEITAK — Home is closer than you think"
      className={cn(sizeMap[size], "h-auto object-contain", className)}
    />
  );
}
