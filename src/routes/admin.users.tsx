import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban, ShieldOff, Trash2, Search, Users, CalendarDays, CalendarRange, Eye, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users - Admin - BEITAK" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminUsersPage,
});

// app_role enum in the database only supports "admin" | "user".
// "Host" is a display-only status inferred from owning at least one listing.
type Role = "admin" | "user";
type DisplayRole = Role | "host";

type TrafficStats = {
  visitors_today: number;
  visitors_week: number;
  visitors_month: number;
  views_today: number;
  views_week: number;
  views_month: number;
  top_pages: { path: string; views: number }[];
  sources: { label: string; visitors: number }[];
  countries: { label: string; visitors: number }[];
  devices: { label: string; visitors: number }[];
  listings: { id: string; title: string; views: number; reserve_clicks: number; conversion: number }[];
  funnel: { visitors: number; listing_viewers: number; reserve_clicks: number };
};

const fmtExact = (d: string) =>
  new Date(d).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit",
  });
const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof Users }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 font-display text-3xl text-foreground">{value}</div>
    </div>
  );
}

function RankedList({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 font-display text-lg text-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {rows.map((r, i) => (
            <li key={`${r.label}-${i}`} className="flex items-center justify-between gap-3">
              <span className="truncate text-foreground" title={r.label}>{r.label}</span>
              <span className="flex-none font-bold text-primary">{r.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TrafficSection() {
  const statsQ = useQuery({
    queryKey: ["admin-traffic-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_traffic_stats");
      if (error) throw error;
      return data as unknown as TrafficStats;
    },
  });
  const visitsQ = useQuery({
    queryKey: ["admin-recent-visits"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_recent_visits", { max_rows: 50 });
      if (error) throw error;
      return data ?? [];
    },
  });
  const s = statsQ.data;
  const n = (v: number | undefined) => (v ?? 0).toLocaleString();
  const f = s?.funnel;
  const conv = f && f.visitors > 0 ? ((f.reserve_clicks / f.visitors) * 100).toFixed(1) : "0.0";

  return (
    <section className="mb-8 space-y-4">
      <h2 className="font-display text-2xl text-foreground">Website traffic</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Visitors today" value={n(s?.visitors_today)} icon={Users} />
        <StatCard label="Visitors this week" value={n(s?.visitors_week)} icon={CalendarDays} />
        <StatCard label="Visitors this month" value={n(s?.visitors_month)} icon={CalendarRange} />
        <StatCard label="Page views today" value={n(s?.views_today)} icon={Eye} />
        <StatCard label="Page views this month" value={n(s?.views_month)} icon={BarChart3} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Funnel (last 30 days)</div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span><span className="font-display text-2xl text-foreground">{n(f?.visitors)}</span> <span className="text-muted-foreground">Visitors</span></span>
          <span className="text-muted-foreground">→</span>
          <span><span className="font-display text-2xl text-foreground">{n(f?.listing_viewers)}</span> <span className="text-muted-foreground">Viewed a listing</span></span>
          <span className="text-muted-foreground">→</span>
          <span><span className="font-display text-2xl text-foreground">{n(f?.reserve_clicks)}</span> <span className="text-muted-foreground">Reserve clicks</span></span>
          <span className="ml-auto rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">{conv}% conversion</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <RankedList title="Top pages" rows={(s?.top_pages ?? []).map((r) => ({ label: r.path, value: r.views }))} />
        <RankedList title="Traffic sources" rows={(s?.sources ?? []).map((r) => ({ label: r.label, value: r.visitors }))} />
        <RankedList title="Countries" rows={(s?.countries ?? []).map((r) => ({ label: r.label, value: r.visitors }))} />
        <RankedList title="Devices" rows={(s?.devices ?? []).map((r) => ({ label: r.label, value: r.visitors }))} />
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <h3 className="p-4 pb-2 font-display text-lg text-foreground">Listings performance (30 days)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3">Listing</th>
                <th className="p-3 text-right">Views</th>
                <th className="p-3 text-right">Reserve clicks</th>
                <th className="p-3 text-right">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {(s?.listings ?? []).map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="p-3 font-medium">{l.title}</td>
                  <td className="p-3 text-right">{n(l.views)}</td>
                  <td className="p-3 text-right">{n(l.reserve_clicks)}</td>
                  <td className="p-3 text-right text-primary">{Number(l.conversion ?? 0).toFixed(1)}%</td>
                </tr>
              ))}
              {(s?.listings ?? []).length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <h3 className="p-4 pb-2 font-display text-lg text-foreground">Recent visits</h3>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Page</th>
                <th className="p-3">Source</th>
                <th className="p-3">Country</th>
                <th className="p-3">Device</th>
                <th className="p-3">Visitor</th>
              </tr>
            </thead>
            <tbody>
              {(visitsQ.data ?? []).map((v, i) => (
                <tr key={`${v.created_at}-${i}`} className="border-t border-border">
                  <td className="whitespace-nowrap p-3 text-muted-foreground">{fmtExact(v.created_at)}</td>
                  <td className="max-w-[240px] truncate p-3" title={v.path}>{v.listing_title || v.path}</td>
                  <td className="p-3">{v.source ?? "-"}</td>
                  <td className="p-3">{v.country ?? "-"}</td>
                  <td className="p-3">{v.device ?? "-"}</td>
                  <td className="whitespace-nowrap p-3">
                    {v.user_name ? v.user_name : (
                      <>Guest <span className="text-muted-foreground">{(v.visitor_id ?? "").slice(0, 6)}</span></>
                    )}
                  </td>
                </tr>
              ))}
              {(visitsQ.data ?? []).length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function AdminUsersPage() {
  const [search, setSearch] = useState("");

  const lastVisitsQ = useQuery({
    queryKey: ["admin-user-last-visits"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_user_last_visits");
      if (error) throw error;
      const map = new Map<string, { last_visit: string; visit_count: number }>();
      (data ?? []).forEach((r) => r.user_id && map.set(r.user_id, { last_visit: r.last_visit, visit_count: Number(r.visit_count) }));
      return map;
    },
  });

  const usersQ = useQuery({
    queryKey: ["admin-users-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, phone, is_banned, created_at, user_roles(role)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Map of host user_ids inferred from listings
  const hostsQ = useQuery({
    queryKey: ["admin-users-hosts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("host_id");
      if (error) throw error;
      const set = new Set<string>();
      (data ?? []).forEach((r) => r.host_id && set.add(r.host_id));
      return set;
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return usersQ.data ?? [];
    return (usersQ.data ?? []).filter(
      (u) =>
        (u.full_name ?? "").toLowerCase().includes(term) ||
        (u.phone ?? "").toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term),
    );
  }, [usersQ.data, search]);

  const setRole = async (userId: string, newRole: Role) => {
    // Remove existing custom role rows for this user, then insert the new one.
    // (We keep "user" as the default — clearing rows removes admin/host elevation.)
    const { error: delErr } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (delErr) {
      toast.error(delErr.message);
      return;
    }
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Role set to ${newRole}`);
    usersQ.refetch();
  };

  const toggleBan = async (id: string, banned: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: !banned })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(banned ? "User unsuspended" : "User suspended");
      usersQ.refetch();
    }
  };

  const deleteUser = async (id: string) => {
    if (
      !confirm(
        "Delete this user's profile? Their account will lose access. This cannot be undone.",
      )
    )
      return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("User deleted");
      usersQ.refetch();
    }
  };

  const inferRole = (u: (typeof filtered)[number]): DisplayRole => {
    const roles = (u.user_roles ?? []).map((r) => r.role);
    if (roles.includes("admin")) return "admin";
    if (hostsQ.data?.has(u.id)) return "host";
    return "user";
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage roles, suspensions, and access.
        </p>
      </header>

      <TrafficSection />

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card p-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search name, phone, or id…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {usersQ.data?.length ?? 0}
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3">Name</th>
              <th className="w-32 whitespace-nowrap p-3">Phone</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Last visit</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const role = inferRole(u);
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3 font-medium">{u.full_name ?? "-"}</td>
                  <td className="w-32 whitespace-nowrap p-3 text-xs text-muted-foreground">
                    {u.phone ?? "-"}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Select
                        value={role === "host" ? "user" : role}
                        onValueChange={(v) => setRole(u.id, v as Role)}
                      >
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Guest</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {role === "host" && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold uppercase text-primary">
                          Host
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {u.is_banned ? (
                      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-bold uppercase text-destructive">
                        Suspended
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Active</span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {fmtDateTime(u.created_at)}
                  </td>
                  <td className="whitespace-nowrap p-3">
                    {(() => {
                      const lv = lastVisitsQ.data?.get(u.id);
                      if (!lv) return <span className="text-muted-foreground">-</span>;
                      return (
                        <>
                          <div>{fmtDateTime(lv.last_visit)}</div>
                          <div className="text-xs text-muted-foreground">{lv.visit_count} {lv.visit_count === 1 ? "visit" : "visits"}</div>
                        </>
                      );
                    })()}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleBan(u.id, u.is_banned)}
                        title={u.is_banned ? "Unsuspend" : "Suspend"}
                      >
                        {u.is_banned ? (
                          <ShieldOff className="h-4 w-4" />
                        ) : (
                          <Ban className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteUser(u.id)}
                        className="text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
