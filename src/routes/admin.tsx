import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, Home as HomeIcon, Calendar, DollarSign, Trash2, Ban, ShieldOff, Plus } from "lucide-react";
import { AdminListingForm } from "@/components/AdminListingForm";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — BEITAK" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<"overview" | "users" | "listings" | "bookings">("overview");
  const [showNew, setShowNew] = useState(false);

  const usersQ = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, is_banned, created_at, user_roles(role)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const listingsQ = useQuery({
    queryKey: ["admin-listings"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, location, price_per_night, is_active, host_id, profiles:host_id(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const bookingsQ = useQuery({
    queryKey: ["admin-bookings"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, check_in, check_out, total_price, status, listings(title, location), profiles:guest_id(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto mt-20 max-w-md text-center">
          <Shield className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 font-display text-3xl">Admin login required</h1>
          <Button asChild className="mt-4"><Link to="/auth/login">Log in</Link></Button>
        </div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto mt-20 max-w-md text-center">
          <Shield className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 font-display text-3xl">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You need admin privileges to view this page.
          </p>
          <Button asChild variant="outline" className="mt-4"><Link to="/">Back home</Link></Button>
        </div>
      </div>
    );
  }

  const totalRevenue = (bookingsQ.data ?? [])
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((s, b) => s + Number(b.total_price), 0);

  const toggleBan = async (id: string, banned: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_banned: !banned }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(banned ? "User unbanned" : "User banned"); usersQ.refetch(); }
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); listingsQ.refetch(); }
  };

  const toggleListingActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("listings").update({ is_active: !active }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); listingsQ.refetch(); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="font-display text-4xl">Admin dashboard</h1>
          </div>
          <Button
            onClick={() => { setTab("listings"); setShowNew(true); }}
            size="lg"
            className="gap-2"
          >
            <Plus className="h-5 w-5" /> Add new listing
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users ({usersQ.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="listings">Listings ({listingsQ.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="bookings">Bookings ({bookingsQ.data?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard icon={Users} label="Users" value={String(usersQ.data?.length ?? 0)} />
              <StatCard icon={HomeIcon} label="Listings" value={String(listingsQ.data?.length ?? 0)} />
              <StatCard icon={Calendar} label="Bookings" value={String(bookingsQ.data?.length ?? 0)} />
              <StatCard icon={DollarSign} label="Revenue (USD)" value={`$${totalRevenue.toFixed(0)}`} highlight />
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Name</th><th className="p-3">Phone</th>
                    <th className="p-3">Roles</th><th className="p-3">Status</th><th className="p-3">Joined</th><th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {usersQ.data?.map((u) => (
                    <tr key={u.id} className="border-t border-border">
                      <td className="p-3 font-medium">{u.full_name ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{u.phone ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{(u.user_roles ?? []).map((r) => r.role).join(", ") || "user"}</td>
                      <td className="p-3">{u.is_banned ? <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">BANNED</span> : <span className="text-muted-foreground">Active</span>}</td>
                      <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => toggleBan(u.id, u.is_banned)} className={u.is_banned ? "" : "text-destructive"}>
                          {u.is_banned ? <ShieldOff className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="listings" className="mt-6">
            <div className="mb-4 flex justify-end">
              <Button onClick={() => setShowNew(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add new listing
              </Button>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Title</th><th className="p-3">Location</th>
                    <th className="p-3">Host</th><th className="p-3">Price</th><th className="p-3">Status</th><th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {listingsQ.data?.map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="p-3"><Link to="/listing/$id" params={{ id: l.id }} className="font-medium hover:text-primary">{l.title}</Link></td>
                      <td className="p-3 text-muted-foreground">{l.location}</td>
                      <td className="p-3 text-muted-foreground">{l.profiles?.full_name ?? "—"}</td>
                      <td className="p-3">${Number(l.price_per_night).toFixed(0)}</td>
                      <td className="p-3">{l.is_active ? <span className="text-primary">Active</span> : <span className="text-muted-foreground">Hidden</span>}</td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => toggleListingActive(l.id, l.is_active)}>
                          {l.is_active ? "Hide" : "Show"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteListing(l.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {user && (
              <AdminListingForm
                open={showNew}
                onClose={() => setShowNew(false)}
                onCreated={() => listingsQ.refetch()}
                adminUserId={user.id}
              />
            )}
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Listing</th><th className="p-3">Guest</th>
                    <th className="p-3">Dates</th><th className="p-3">Total</th><th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsQ.data?.map((b) => (
                    <tr key={b.id} className="border-t border-border">
                      <td className="p-3 font-medium">{b.listings?.title}</td>
                      <td className="p-3 text-muted-foreground">{b.profiles?.full_name ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{b.check_in} → {b.check_out}</td>
                      <td className="p-3">${Number(b.total_price).toFixed(2)}</td>
                      <td className="p-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase">{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight = false }: { icon: typeof Shield; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <p className={`mt-2 font-display text-4xl ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
