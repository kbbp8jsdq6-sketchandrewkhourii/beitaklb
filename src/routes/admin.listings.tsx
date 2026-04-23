import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2, Plus, Filter, Pencil } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { AdminListingForm } from "@/components/AdminListingForm";
import { AdminListingEditForm } from "@/components/AdminListingEditForm";

export const Route = createFileRoute("/admin/listings")({
  head: () => ({
    meta: [
      { title: "Listings — Admin — BEITAK" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminListingsPage,
});

type Category = "villa" | "cabin" | "apartment";

function AdminListingsPage() {
  const { user } = useAuth();
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [hostFilter, setHostFilter] = useState<string>("all");

  const listingsQ = useQuery({
    queryKey: ["admin-listings-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(
          "id, title, category, price_per_night, is_active, status, host_id, created_at, profiles:host_id(full_name)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const allHosts = useMemo(() => {
    const map = new Map<string, string>();
    (listingsQ.data ?? []).forEach((l) => {
      if (l.host_id) {
        map.set(l.host_id, l.profiles?.full_name ?? "Unnamed host");
      }
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [listingsQ.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (listingsQ.data ?? []).filter((l) => {
      if (categoryFilter !== "all" && l.category !== categoryFilter) return false;
      if (hostFilter !== "all" && l.host_id !== hostFilter) return false;
      if (term && !l.title.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [listingsQ.data, categoryFilter, hostFilter, search]);

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from("listings")
      .update({ is_active: !active })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(active ? "Listing hidden" : "Listing visible");
      listingsQ.refetch();
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      listingsQ.refetch();
    }
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Listings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All listings on the platform.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New listing
        </Button>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as Category | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
            <SelectItem value="cabin">Cabin</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
          </SelectContent>
        </Select>
        <Select value={hostFilter} onValueChange={setHostFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Host" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All hosts</SelectItem>
            {allHosts.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                {h.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {listingsQ.data?.length ?? 0}
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Host</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Posted</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="p-3">
                  <Link
                    to="/listing/$id"
                    params={{ id: l.id }}
                    className="font-medium hover:text-primary"
                  >
                    {l.title}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">
                  {l.profiles?.full_name ?? "—"}
                </td>
                <td className="p-3 capitalize text-muted-foreground">
                  {l.category}
                </td>
                <td className="p-3">${Number(l.price_per_night).toFixed(0)}</td>
                <td className="p-3 text-muted-foreground">
                  {new Date(l.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <StatusPill status={l.status} active={l.is_active} />
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(l.id)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleActive(l.id, l.is_active)}
                      title={l.is_active ? "Hide" : "Show"}
                    >
                      {l.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteListing(l.id)}
                      className="text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  No listings match your filters.
                </td>
              </tr>
            )}
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

      <AdminListingEditForm
        open={editingId !== null}
        listingId={editingId}
        onClose={() => setEditingId(null)}
        onSaved={() => listingsQ.refetch()}
      />
    </div>
  );
}

function StatusPill({
  status,
  active,
}: {
  status: string | null;
  active: boolean;
}) {
  const s = status ?? "approved";
  if (s === "pending") {
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold uppercase text-amber-700 dark:text-amber-400">
        Pending
      </span>
    );
  }
  if (s === "rejected") {
    return (
      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-bold uppercase text-destructive">
        Rejected
      </span>
    );
  }
  if (!active) {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold uppercase text-muted-foreground">
        Hidden
      </span>
    );
  }
  return (
    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold uppercase text-primary">
      Active
    </span>
  );
}
