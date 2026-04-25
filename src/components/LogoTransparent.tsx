import { cn } from "@/lib/utils";
import logoSrc from "@/assets/beitak-logo-hero.png";
import logoHeroWhite from "@/assets/beitak-logo-hero-white.png";

interface LogoTransparentProps {
  size?: "navbar" | "hero";
  className?: string;
}

// Width-based sizing preserves aspect ratio (h-auto).
// - navbar : 90px mobile / 120px desktop
// - hero   : 160px mobile / 220px desktop
const sizeMap: Record<NonNullable<LogoTransparentProps["size"]>, string> = {
  navbar: "w-[90px] sm:w-[120px]",
  // Slightly larger than 380x240 per request.
  hero: "w-[280px] sm:w-[440px]",
};

/**
 * Logo variant used in the homepage hero and the navbar/header.
 * Uses mix-blend-mode: multiply on a transparent background so any residual
 * white pixels in the source PNG drop out cleanly when placed over imagery.
 */
export function LogoTransparent({ size = "navbar", className }: LogoTransparentProps) {
  // Hero uses the white-text transparent PNG; navbar keeps the original asset.
  const src = size === "hero" ? logoHeroWhite : logoSrc;
  const isHero = size === "hero";
  return (
    <img
      src={src}
      alt="BEITAK — Home is closer than you think"
      width={isHero ? 440 : 120}
      height={isHero ? 280 : 80}
      decoding="async"
      loading={isHero ? "eager" : "eager"}
      fetchPriority={isHero ? "high" : "auto"}
      className={cn(sizeMap[size], "h-auto object-contain", className)}
      style={
        isHero
          ? { background: "transparent" }
          : {
              background: "transparent",
              mixBlendMode: "multiply",
              filter: "contrast(1.1)",
            }
      }
    />
  );
}
