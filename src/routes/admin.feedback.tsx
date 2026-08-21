import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Star, Pin, Eye, EyeOff, Trash2, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback - Admin - BEITAK" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminFeedbackPage,
});

type Status = "pending" | "approved" | "hidden";

function AdminFeedbackPage() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    let rows = q.data ?? [];
    if (filter !== "all") rows = rows.filter((r) => r.status === filter);
    const term = search.trim().toLowerCase();
    if (term) {
      rows = rows.filter(
        (r) =>
          r.author_name.toLowerCase().includes(term) ||
          r.message.toLowerCase().includes(term),
      );
    }
    return rows;
  }, [q.data, filter, search]);

  const setStatus = async (id: string, status: Status) => {
    const { error } = await supabase
      .from("feedback")
      .update({ status })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Feedback ${status}`);
      q.refetch();
    }
  };

  const togglePin = async (id: string, pinned: boolean) => {
    if (!pinned) {
      // Unpin all others first (only one pinned at a time per partial unique index)
      const { error: clearErr } = await supabase
        .from("feedback")
        .update({ is_pinned: false })
        .eq("is_pinned", true);
      if (clearErr) {
        toast.error(clearErr.message);
        return;
      }
    }
    const { error } = await supabase
      .from("feedback")
      .update({ is_pinned: !pinned })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(pinned ? "Unpinned" : "Pinned to top");
      q.refetch();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this feedback permanently?")) return;
    const { error } = await supabase.from("feedback").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Feedback deleted");
      q.refetch();
    }
  };

  const counts = useMemo(() => {
    const all = q.data ?? [];
    return {
      all: all.length,
      pending: all.filter((r) => r.status === "pending").length,
      approved: all.filter((r) => r.status === "approved").length,
      hidden: all.filter((r) => r.status === "hidden").length,
    };
  }, [q.data]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-foreground">Feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve, hide, pin, or delete guest reviews. Approved reviews appear
          on the public Feedback page.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", "pending", "approved", "hidden"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              filter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {s} ({counts[s]})
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 w-48 border-0 p-0 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      {q.isLoading && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((f) => (
          <article
            key={f.id}
            className={`relative flex flex-col rounded-2xl border bg-card p-5 shadow-sm ${
              f.is_pinned ? "border-primary ring-1 ring-primary/30" : "border-border"
            }`}
          >
            {f.is_pinned && (
              <span className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                <Pin className="h-3 w-3" /> Pinned
              </span>
            )}
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-foreground">{f.author_name}</p>
              <StatusBadge status={f.status as Status} />
            </div>
            <div className="mt-1 flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < f.rating
                      ? "fill-[#F5B400] text-[#F5B400]"
                      : "fill-none text-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/80">
              "{f.message}"
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {new Date(f.created_at).toLocaleString()}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {f.status !== "approved" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatus(f.id, "approved")}
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> Approve
                </Button>
              )}
              {f.status !== "hidden" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatus(f.id, "hidden")}
                >
                  <EyeOff className="mr-1 h-3.5 w-3.5" /> Hide
                </Button>
              )}
              {f.status === "hidden" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatus(f.id, "pending")}
                >
                  <Eye className="mr-1 h-3.5 w-3.5" /> Unhide
                </Button>
              )}
              {f.status === "approved" && (
                <Button
                  size="sm"
                  variant={f.is_pinned ? "default" : "outline"}
                  onClick={() => togglePin(f.id, f.is_pinned)}
                >
                  <Pin className="mr-1 h-3.5 w-3.5" />
                  {f.is_pinned ? "Unpin" : "Pin"}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-destructive"
                onClick={() => remove(f.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </article>
        ))}
        {!q.isLoading && filtered.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No feedback found.
          </p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    hidden: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}
    >
      {status}
    </span>
  );
}
