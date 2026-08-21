import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, Trash2, CheckCheck, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/contact")({
  head: () => ({
    meta: [
      { title: "Contact - Admin - BEITAK" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminContactPage,
});

type Status = "unread" | "read" | "resolved";

function AdminContactPage() {
  const [filter, setFilter] = useState<Status | "all">("all");

  const q = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const rows = q.data ?? [];
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [q.data, filter]);

  const counts = useMemo(() => {
    const all = q.data ?? [];
    return {
      all: all.length,
      unread: all.filter((r) => r.status === "unread").length,
      read: all.filter((r) => r.status === "read").length,
      resolved: all.filter((r) => r.status === "resolved").length,
    };
  }, [q.data]);

  const setStatus = async (id: string, status: Status) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ status })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Marked as ${status}`);
      q.refetch();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this message permanently?")) return;
    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Message deleted");
      q.refetch();
    }
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-foreground">
          Contact & Inquiries
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Messages submitted through the contact form.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "unread", "read", "resolved"] as const).map((s) => (
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
      </div>

      {q.isLoading && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}

      <div className="space-y-3">
        {filtered.map((m) => (
          <article
            key={m.id}
            className={`rounded-2xl border bg-card p-5 shadow-sm transition ${
              m.status === "unread" ? "border-primary/40" : "border-border"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-semibold text-foreground">
                    {m.name}
                  </h2>
                  <StatusBadge status={m.status as Status} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <a
                    href={`mailto:${m.email}`}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <Mail className="h-3 w-3" /> {m.email}
                  </a>
                  {m.phone && (
                    <a
                      href={`tel:${m.phone}`}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      <Phone className="h-3 w-3" /> {m.phone}
                    </a>
                  )}
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {m.status === "unread" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus(m.id, "read")}
                  >
                    <MailOpen className="mr-1 h-3.5 w-3.5" /> Mark read
                  </Button>
                )}
                {m.status !== "resolved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus(m.id, "resolved")}
                  >
                    <CheckCheck className="mr-1 h-3.5 w-3.5" /> Resolve
                  </Button>
                )}
                {m.status === "resolved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus(m.id, "unread")}
                  >
                    Reopen
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => remove(m.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {m.subject && (
              <p className="mt-3 text-sm font-semibold text-foreground">
                {m.subject}
              </p>
            )}
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
              {m.message}
            </p>
          </article>
        ))}
        {!q.isLoading && filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No messages found.
          </p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    unread: "bg-primary/15 text-primary",
    read: "bg-muted text-muted-foreground",
    resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}
    >
      {status}
    </span>
  );
}
