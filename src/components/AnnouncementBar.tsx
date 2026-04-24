import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_ITEMS = [
  "🏠 500+ Customers Served",
  "🏡 400+ Listings Available",
  "📍 Covering All Areas in Lebanon",
  "✅ 0% Service Fees",
];

function LoopContent({ items }: { items: string[] }) {
  return (
    <div className="flex shrink-0 items-center gap-6 pr-6">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-6 whitespace-nowrap">
          <span>{item}</span>
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
      className="relative w-full overflow-hidden backdrop-blur-sm"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
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
