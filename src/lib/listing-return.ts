const RETURN_TO_KEY = "beitak:returnTo";
const RETURN_SCROLL_KEY = "beitak:returnScrollY";

function isSafeReturnUrl(url: string | null): url is string {
  return !!url && url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/listing/");
}

export function currentRelativeUrl() {
  if (typeof window === "undefined") return null;
  return window.location.pathname + window.location.search + window.location.hash;
}

export function saveListingReturnState(returnUrl?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const target = returnUrl ?? currentRelativeUrl();
    if (!isSafeReturnUrl(target)) return;
    sessionStorage.setItem(RETURN_TO_KEY, target);
    sessionStorage.setItem(RETURN_SCROLL_KEY, String(window.scrollY));
  } catch {}
}

export function getListingReturnUrl() {
  if (typeof window === "undefined") return null;
  try {
    const target = sessionStorage.getItem(RETURN_TO_KEY);
    return isSafeReturnUrl(target) ? target : null;
  } catch {
    return null;
  }
}

export function restoreListingReturnScroll() {
  if (typeof window === "undefined") return;
  try {
    const target = sessionStorage.getItem(RETURN_TO_KEY);
    const current = currentRelativeUrl();
    if (!target || target !== current) return;

    const scrollY = Number(sessionStorage.getItem(RETURN_SCROLL_KEY));
    
    if (!Number.isFinite(scrollY)) return;
    requestAnimationFrame(() => {
     requestAnimationFrame(() => {
  window.scrollTo({ top: scrollY, behavior: "auto" });
  sessionStorage.removeItem(RETURN_TO_KEY);
  sessionStorage.removeItem(RETURN_SCROLL_KEY);
});
    });
  } catch {}
}
