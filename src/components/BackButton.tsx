import { Link, useLocation } from "@tanstack/react-router";
import { X } from "lucide-react";

/**
 * Fixed back-to-home button shown on every non-homepage route.
 * Top-left, always visible while scrolling.
 */
export function BackButton() {
  const { pathname } = useLocation();
  if (pathname === "/") return null;

  return (
    <Link
      to="/"
      aria-label="Back to home"
      className="fixed left-3 top-3 z-[9998] inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/90 text-black shadow-sm backdrop-blur transition hover:bg-white hover:shadow-md sm:left-4 sm:top-4"
    >
      <X className="h-5 w-5" strokeWidth={2.25} />
    </Link>
  );
}
