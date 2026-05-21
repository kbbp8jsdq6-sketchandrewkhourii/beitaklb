import { useLocation, useRouter } from "@tanstack/react-router";
import { X } from "lucide-react";
import { getListingReturnUrl } from "@/lib/listing-return";

/**
 * Fixed back/exit button shown on every non-homepage route.
 *
 * Behavior:
 * - On listing pages, prefer a stored return URL (set when the user clicked
 *   a card from /search or /). This guarantees the exact prior search
 *   results — filters, query, scroll — are restored even when the listing
 *   was opened in a fresh tab or after a hard refresh.
 * - Otherwise, prefer browser history so TanStack's scroll restoration runs.
 * - Final fallback: navigate to homepage.
 */
export function BackButton() {
  const { pathname } = useLocation();
  const router = useRouter();
  if (pathname === "/") return null;

  const handleBack = () => {
  const returnTo = getListingReturnUrl();
  if (returnTo) {
    router.navigate({ href: returnTo, resetScroll: false });
    return;
  }
  router.navigate({ to: "/search", resetScroll: false });
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
