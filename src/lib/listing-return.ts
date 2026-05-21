const RETURN_TO_KEY = "beitak:returnTo";
const RETURN_SCROLL_KEY = "beitak:returnScrollY";
const RETURN_CONSUMED_KEY = "beitak:returnConsumed";

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
    sessionStorage.removeItem(RETURN_CONSUMED_KEY);
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

    // Only restore scroll once per navigation back
    const consumed = sessionStorage.getItem(RETURN_CONSUMED_KEY);
    if (consumed === "1") return;
    sessionStorage.setItem(RETURN_CONSUMED_KEY, "1");

    const scrollY = Number(sessionStorage.getItem(RETURN_SCROLL_KEY));
    if (!Number.isFinite(scrollY)) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "auto" }));
    });
  } catch {}
}
const FIND_STATE_KEY = "beitak:findState";

export function saveFindYourUnitState(state: object) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(FIND_STATE_KEY, JSON.stringify(state));
  } catch {}
}

export function loadFindYourUnitState(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(FIND_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
