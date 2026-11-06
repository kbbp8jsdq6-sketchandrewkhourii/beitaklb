import { supabase } from "@/integrations/supabase/client";

const UUID_RE = /^\/listing\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|preview/i;

const TZ_MAP: Record<string, string> = {
  "Asia/Beirut": "Lebanon",
  "America/Toronto": "Canada",
  "America/Vancouver": "Canada",
  "America/Montreal": "Canada",
  "America/Edmonton": "Canada",
  "America/Winnipeg": "Canada",
  "America/Halifax": "Canada",
  "America/Mexico_City": "Mexico",
  "America/Sao_Paulo": "Brazil",
  "America/Argentina/Buenos_Aires": "Argentina",
  "America/Bogota": "Colombia",
  "America/Santiago": "Chile",
  "America/Lima": "Peru",
  "America/Caracas": "Venezuela",
  "Europe/Paris": "France",
  "Europe/London": "United Kingdom",
  "Europe/Berlin": "Germany",
  "Asia/Dubai": "UAE",
  "Asia/Riyadh": "Saudi Arabia",
  "Asia/Qatar": "Qatar",
  "Asia/Kuwait": "Kuwait",
  "Europe/Istanbul": "Turkey",
  "Africa/Cairo": "Egypt",
  "Asia/Amman": "Jordan",
  "Asia/Damascus": "Syria",
  "Europe/Athens": "Greece",
  "Asia/Nicosia": "Cyprus",
  "Europe/Nicosia": "Cyprus",
  "Africa/Lagos": "Nigeria",
  "Africa/Abidjan": "Ivory Coast",
  "Europe/Madrid": "Spain",
  "Europe/Rome": "Italy",
  "Europe/Brussels": "Belgium",
  "Europe/Stockholm": "Sweden",
};

function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

function getId(storage: () => Storage, key: string): string {
  try {
    const s = storage();
    let v = s.getItem(key);
    if (!v) {
      v = uuid();
      s.setItem(key, v);
    }
    return v;
  } catch {
    return uuid();
  }
}

function getDevice(): string {
  const ua = navigator.userAgent || "";
  if (/ipad|tablet|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
  const w = window.innerWidth || screen.width;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getCountry(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return null;
    if (TZ_MAP[tz]) return TZ_MAP[tz];
    if (tz.startsWith("America/")) return "United States";
    if (tz.startsWith("Australia/")) return "Australia";
    return tz;
  } catch {
    return null;
  }
}

function classifyReferrer(ref: string): string {
  if (!ref) return "Direct";
  let host: string;
  try {
    host = new URL(ref).hostname.toLowerCase();
  } catch {
    return "Direct";
  }
  if (host === window.location.hostname.toLowerCase()) return "Direct";
  if (host.includes("google")) return "Google";
  if (host.includes("bing")) return "Bing";
  if (host.includes("instagram")) return "Instagram";
  if (host.includes("facebook") || /(^|\.)fb\./.test(host) || host === "fb.com") return "Facebook";
  if (host.includes("whatsapp") || host.includes("wa.me")) return "WhatsApp";
  if (host.includes("tiktok")) return "TikTok";
  return host;
}

type Attribution = {
  source: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

function getAttribution(): Attribution {
  const KEY = "bk_attr";
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved) return JSON.parse(saved) as Attribution;
  } catch {
    /* ignore */
  }
  const params = new URLSearchParams(window.location.search);
  const utm_source = params.get("utm_source");
  const ref = document.referrer || "";
  const attr: Attribution = {
    source: utm_source || classifyReferrer(ref),
    referrer: ref || null,
    utm_source,
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(attr));
  } catch {
    /* ignore */
  }
  return attr;
}

let lastPath = "";
let lastAt = 0;

export function trackPageView(path: string, userId: string | null, isAdmin = false): void {
  try {
    if (typeof window === "undefined") return;
    if (isAdmin || path.startsWith("/admin")) return;
    if (navigator.webdriver || BOT_RE.test(navigator.userAgent || "")) return;
    const now = Date.now();
    if (path === lastPath && now - lastAt < 2000) return;
    lastPath = path;
    lastAt = now;

    const attr = getAttribution();
    const row = {
      visitor_id: getId(() => localStorage, "bk_vid"),
      session_id: getId(() => sessionStorage, "bk_sid"),
      user_id: userId,
      path,
      listing_id: path.match(UUID_RE)?.[1] ?? null,
      device: getDevice(),
      country: getCountry(),
      ...attr,
    };
    void supabase
      .from("page_views")
      .insert(row)
      .then(
        () => {},
        () => {},
      );
  } catch {
    /* swallow */
  }
}
