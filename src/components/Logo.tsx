import { cn } from "@/lib/utils";
import logoSrc from "@/assets/beitak-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "h-8",
  md: "h-12",
  lg: "h-20",
};

export function Logo({ size = "md", className }: LogoProps) {
  return (
    <img
      src={logoSrc}
      alt="BEITAK — Home is closer than you think"
      className={cn(sizeMap[size], "w-auto object-contain", className)}
    />
  );
}
