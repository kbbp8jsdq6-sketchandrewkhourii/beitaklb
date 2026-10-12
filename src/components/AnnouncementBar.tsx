import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Home, MapPin, Users, BadgePercent, Check, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_ITEMS = [
  "400+ stays listed",
  "60+ towns across Lebanon",
  "500+ customers served",
  "0% service fees",
];

const EMOJI = /\p{Extended_Pictographic}|\u200D|\uFE0F/gu;

function pickIcon(text: string): LucideIcon {
  const t = text.toLowerCase();
  if (/(listing|stay|home|house|unit)/.test(t)) return Home;
  if (/(area|town|lebanon|location|district|village)/.test(t)) return MapPin;
  if (/(customer|guest|client|traveler|traveller)/.test(t)) return Users;
  if (/(fee|%|commission|free)/.test(t)) return BadgePercent;
  return Check;
}

function Item({ text }: { text: string }) {
  const clean = text.replace(EMOJI, "").replace(/\s+/g, " ").trim();
  const m = clean.match(/^([\d.,]+[+%]?)\s+(.*)$/);
  const Icon = pickIcon(clean);
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <Icon className="h-[15px] w-[15px] shrink-0 opacity-85" strokeWidth={2} aria-hidden="true" />
      {m ? (
        <span>
          <b className="font-bold">{m[1]}</b> {m[2]}
        </span>
      ) : (
        <span>{clean}</span>
      )}
    </span>
  );
}

export function AnnouncementBar() {
  const q = useQuery({
    queryKey: ["active-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("message")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []).map((r) => r.message);
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const items: string[] = q.data && q.data.length > 0 ? q.data : FALLBACK_ITEMS;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (index >= items.length) setIndex(0);
  }, [items.length, index]);

  useEffect(() => {
    if (paused || reduced || items.length < 2) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % items.length), 4000);
    return () => window.clearTimeout(id);
  }, [index, paused, reduced, items.length]);

  return (
    <div
      className="relative w-full overflow-hidden bg-[#CC0000] font-sans text-[13px] font-medium tracking-[0.01em] text-white"
      role="region"
      aria-label="Announcements"
    >
      {/* Desktop: static row */}
      <ul className="mx-auto hidden h-11 max-w-7xl items-center justify-center overflow-hidden px-12 md:flex lg:px-16">
        {items.map((t, i) => (
          <li key={i} className="flex items-center">
            {i > 0 && <span aria-hidden="true" className="h-3.5 w-px bg-white/35" />}
            <span className="px-7">
              <Item text={t} />
            </span>
          </li>
        ))}
      </ul>

      {/* Mobile: one item at a time; tap to pause */}
      <ul className="sr-only md:hidden">
        {items.map((t, i) => (
          <li key={i}>{t.replace(EMOJI, "").trim()}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? "Resume announcements" : "Pause announcements"}
        className="relative block h-10 w-full md:hidden"
      >
        {items.map((t, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`absolute inset-0 flex items-center justify-center px-4 transition-all duration-500 ease-out ${
              i === index ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
            }`}
          >
            <Item text={t} />
          </span>
        ))}
      </button>
    </div>
  );
}
