import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Star, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/featured")({
  head: () => ({
    meta: [
      { title: "Featured Listings - Admin - BEITAK" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminFeaturedPage,
});

const MAX_FEATURED = 6;

type Row = {
  id: string;
  title: string;
  location: string;
  category: "villa" | "cabin" | "apartment";
  is_active: boolean;
  featured: boolean;
};

function AdminFeaturedPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const listingsQ = useQuery({
    queryKey: ["admin-featured-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, location, category, is_active, featured")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const all = listingsQ.data ?? [];
  const featuredCount = useMemo(() => all.filter((l) => l.featured).length, [all]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (l) =>
        l.title.toLowerCase().includes(term) ||
        l.location.toLowerCase().includes(term),
    );
  }, [all, search]);

  const toggleFeatured = async (row: Row, next: boolean) => {
    if (next && featuredCount >= MAX_FEATURED) {
      toast.error(
        `Maximum of ${MAX_FEATURED} featured listings reached. Unfeature another listing first.`,
      );
      return;
    }
    setSavingId(row.id);
    const { error } = await supabase
      .from("listings")
      .update({ featured: next })
      .eq("id", row.id);
    setSavingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? "Listing featured" : "Listing unfeatured");
    qc.invalidateQueries({ queryKey: ["admin-featured-listings"] });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">
            Featured Listings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Toggle which listings appear in the homepage Featured section. Maximum {MAX_FEATURED} at a time.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span className="font-semibold text-foreground">
            {featuredCount} / {MAX_FEATURED}
          </span>
          <span className="text-muted-foreground">featured</span>
        </div>
      </header>

      {featuredCount >= MAX_FEATURED && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          You've reached the maximum of {MAX_FEATURED} featured listings. Unfeature one to feature another.
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings by title or location…"
          className="pl-9"
        />
      </div>

      {listingsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading listings…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No listings found.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {filtered.map((l) => {
            const disabled =
              savingId === l.id || (!l.featured && featuredCount >= MAX_FEATURED);
            return (
              <li
                key={l.id}
                className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-foreground">{l.title}</p>
                    {!l.is_active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {l.location} · {l.category}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {l.featured && (
                    <Star className="h-4 w-4 fill-primary text-primary" />
                  )}
                  <Switch
                    checked={l.featured}
                    disabled={disabled}
                    onCheckedChange={(checked) => toggleFeatured(l, checked)}
                    aria-label={l.featured ? "Unfeature listing" : "Feature listing"}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
