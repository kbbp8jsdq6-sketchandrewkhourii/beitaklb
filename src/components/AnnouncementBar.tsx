import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_ITEMS = [
  "🏠 500+ Customers Served",
  "🏡 400+ Listings Available",
  "📍 Covering All Areas in Lebanon",
  "✅ 0% Service Fees",
];

// Render text with emojis swapped for high-quality Twemoji SVGs (Apple/Google style smoothness).
function renderWithTwemoji(text: string) {
  // Match emoji clusters (covers most pictographs + ZWJ sequences + variation selectors)
  const regex =
    /(\p{Extended_Pictographic}(?:\u200D\p{Extended_Pictographic})*\uFE0F?)/gu;
  const parts = text.split(regex);
  return parts.map((part, idx) => {
    if (regex.test(part)) {
      // Reset regex state since we used .test() with /g
      regex.lastIndex = 0;
      // Convert to hex codepoints for jsdelivr Twemoji CDN (skip variation selector FE0F where appropriate)
      const codepoints = Array.from(part)
        .map((c) => c.codePointAt(0)!.toString(16))
        .filter((cp) => cp !== "fe0f")
        .join("-");
      return (
        <img
          key={idx}
          src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${codepoints}.svg`}
          alt=""
          aria-hidden="true"
          className="inline-block h-[1.1em] w-[1.1em] align-[-0.15em]"
          loading="lazy"
        />
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function LoopContent({ items }: { items: string[] }) {
  return (
    <div className="flex shrink-0 items-center gap-6 pr-6">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-6 whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5">{renderWithTwemoji(item)}</span>
          <span aria-hidden className="text-white/80">⬥</span>
        </span>
      ))}
    </div>
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
    // Refresh every 60s so admin changes appear quickly without a hard reload
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const items = q.data && q.data.length > 0 ? q.data : FALLBACK_ITEMS;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: "#CC0000" }}
      role="region"
      aria-label="Announcements"
    >
      <div className="flex py-3 font-serif text-sm font-bold leading-relaxed tracking-wide text-white announcement-track">
        {/* Two copies for seamless loop */}
        <LoopContent items={items} />
        <LoopContent items={items} />
      </div>
    </div>
  );
}
