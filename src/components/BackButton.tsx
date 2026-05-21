import { useLocation, useRouter } from "@tanstack/react-router";
import { X } from "lucide-react";

/**
 * Fixed back button shown on every non-homepage route.
 * Prefers browser history (so search filters / scroll are restored)
 * and falls back to the homepage when there's no history entry.
 */
export function BackButton() {
  const { pathname } = useLocation();
  const router = useRouter();
  if (pathname === "/") return null;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    router.navigate({ to: "/" });
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Back"
      className="fixed left-3 top-3 z-[9998] inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/90 text-black shadow-sm backdrop-blur transition hover:bg-white hover:shadow-md sm:left-4 sm:top-4"
    >
      <X className="h-5 w-5" strokeWidth={2.25} />
    </button>
  );
}
