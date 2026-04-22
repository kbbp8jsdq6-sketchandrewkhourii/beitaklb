import { cn } from "@/lib/utils";
import logoSrc from "@/assets/beitak-logo-hero.png";

interface LogoTransparentProps {
  size?: "navbar" | "hero";
  className?: string;
}

// Width-based sizing preserves aspect ratio (h-auto).
// - navbar : 90px mobile / 120px desktop
// - hero   : 160px mobile / 220px desktop
const sizeMap: Record<NonNullable<LogoTransparentProps["size"]>, string> = {
  navbar: "w-[90px] sm:w-[120px]",
  hero: "w-[200px] sm:w-[280px]",
};

/**
 * Logo variant used in the homepage hero and the navbar/header.
 * Uses mix-blend-mode: multiply on a transparent background so any residual
 * white pixels in the source PNG drop out cleanly when placed over imagery.
 */
export function LogoTransparent({ size = "navbar", className }: LogoTransparentProps) {
  return (
    <img
      src={logoSrc}
      alt="BEITAK — Home is closer than you think"
      className={cn(sizeMap[size], "h-auto object-contain", className)}
      style={{
        background: "transparent",
        mixBlendMode: "multiply",
        filter: "contrast(1.1)",
      }}
    />
  );
}
