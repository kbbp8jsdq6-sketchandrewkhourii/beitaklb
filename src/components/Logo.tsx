import { MapPin, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: "h-5 w-5", heart: "h-2 w-2", text: "text-xl", tag: "text-[9px]" },
  md: { icon: "h-7 w-7", heart: "h-3 w-3", text: "text-3xl", tag: "text-xs" },
  lg: { icon: "h-12 w-12", heart: "h-5 w-5", text: "text-6xl", tag: "text-sm" },
};

export function Logo({ size = "md", showTagline = false, className }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <MapPin
          className={cn(s.icon, "fill-primary text-primary drop-shadow-sm")}
          strokeWidth={1.5}
        />
        <Heart
          className={cn(
            s.heart,
            "absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 fill-white text-white"
          )}
        />
      </div>
      <div className="flex flex-col leading-none">
        <span className={cn("font-display tracking-wide text-foreground", s.text)}>
          BEITAK
        </span>
        {showTagline && (
          <span className={cn("mt-0.5 font-medium uppercase tracking-widest text-muted-foreground", s.tag)}>
            Home Is Closer Than You Think
          </span>
        )}
      </div>
    </div>
  );
}
