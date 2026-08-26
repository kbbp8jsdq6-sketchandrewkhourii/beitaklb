import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Home as HomeIcon, UserCheck, ClipboardList, Eye, Heart, MousePointerClick } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Overview - Admin - BEITAK" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminOverviewPage,
});

function startOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Sunday as start
  return d;
}
function startOfMonth() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}

function AdminOverviewPage() {
  // Total listings
  const listingsQ = useQuery({
    queryKey: ["admin-overview-listings-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Profiles + roles to split guests vs hosts
  const usersQ = useQuery({
    queryKey: ["admin-overview-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, created_at, user_roles(role)");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Hosts inferred from existing listings
  const hostIdsQ = useQuery({
    queryKey: ["admin-overview-host-ids"],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("host_id");
      if (error) throw error;
      const set = new Set<string>();
      (data ?? []).forEach((r) => r.host_id && set.add(r.host_id));
      return set;
    },
  });

  // Most viewed listings (last 30 days)
  const viewsQ = useQuery({
    queryKey: ["admin-overview-views"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from("listing_views")
        .select("listing_id")
        .gte("created_at", since.toISOString());
      if (error) throw error;
      const counts = new Map<string, number>();
      (data ?? []).forEach((v) =>
        counts.set(v.listing_id, (counts.get(v.listing_id) ?? 0) + 1),
      );
      const top = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      if (top.length === 0) return [] as { id: string; title: string; views: number }[];
      const { data: titles } = await supabase
        .from("listings")
        .select("id, title")
        .in("id", top.map(([id]) => id));
      const titleMap = new Map((titles ?? []).map((t) => [t.id, t.title]));
      return top.map(([id, views]) => ({
        id,
        title: titleMap.get(id) ?? "(deleted)",
        views,
      }));
    },
  });

  // Most favorited listings
  const favoritesQ = useQuery({
    queryKey: ["admin-overview-favorites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("listing_id");
      if (error) throw error;
      const counts = new Map<string, number>();
      (data ?? []).forEach((f) =>
        counts.set(f.listing_id, (counts.get(f.listing_id) ?? 0) + 1),
      );
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (top.length === 0) return [] as { id: string; title: string; favorites: number }[];
      const { data: titles } = await supabase
        .from("listings")
        .select("id, title")
        .in("id", top.map(([id]) => id));
      const titleMap = new Map((titles ?? []).map((t) => [t.id, t.title]));
      return top.map(([id, favorites]) => ({
        id,
        title: titleMap.get(id) ?? "(deleted)",
        favorites,
      }));
    },
  });

  const profiles = usersQ.data ?? [];
  const hostIds = hostIdsQ.data ?? new Set<string>();
  const totalUsers = profiles.length;
  const hostsCount = profiles.filter((p) => hostIds.has(p.id)).length;
  const guestsCount = totalUsers - hostsCount;

  const weekStart = startOfWeek();
  const monthStart = startOfMonth();
  const newThisWeek = profiles.filter(
    (p) => new Date(p.created_at) >= weekStart,
  ).length;
  const newThisMonth = profiles.filter(
    (p) => new Date(p.created_at) >= monthStart,
  ).length;

  // Last-30-days signup trend (per day)
  const signupTrend = (() => {
    const days: { day: string; signups: number }[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push({
        day: `${d.getMonth() + 1}/${d.getDate()}`,
        signups: 0,
      });
    }
    profiles.forEach((p) => {
      const d = new Date(p.created_at);
      d.setHours(0, 0, 0, 0);
      const diff = Math.round(
        (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
      );
      const idx = 29 - diff;
      if (idx >= 0 && idx < 30) days[idx].signups += 1;
    });
    return days;
  })();

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live stats from your platform.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={HomeIcon}
          label="Total listings"
          value={listingsQ.data ?? 0}
        />
        <StatCard icon={Users} label="Total users" value={totalUsers} />
        <StatCard icon={UserCheck} label="Hosts" value={hostsCount} />
        <StatCard icon={Users} label="Guests" value={guestsCount} />
        <StatCard
          icon={ClipboardList}
          label="New this week"
          value={newThisWeek}
        />
        <StatCard
          icon={ClipboardList}
          label="New this month"
          value={newThisMonth}
        />
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">Signups - last 30 days</h2>
        <div className="mt-3 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={signupTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="signups" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <TopList
          title="Most viewed (last 30 days)"
          icon={Eye}
          items={(viewsQ.data ?? []).map((v) => ({
            id: v.id,
            title: v.title,
            value: v.views,
            valueLabel: "views",
          }))}
        />
        <TopList
          title="Most favorited"
          icon={Heart}
          items={(favoritesQ.data ?? []).map((v) => ({
            id: v.id,
            title: v.title,
            value: v.favorites,
            valueLabel: "favorites",
          }))}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 font-display text-3xl text-foreground">{value}</p>
    </div>
  );
}

function TopList({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof Eye;
  items: { id: string; title: string; value: number; valueLabel: string }[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-display text-xl">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {items.map((it, idx) => (
            <li
              key={it.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {idx + 1}
                </span>
                <span className="truncate text-sm font-medium">{it.title}</span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-primary">
                {it.value} {it.valueLabel}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
