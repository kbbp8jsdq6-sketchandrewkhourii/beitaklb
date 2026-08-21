import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements - Admin - BEITAK" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAnnouncementsPage,
});

function AdminAnnouncementsPage() {
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const q = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = async () => {
    const text = draft.trim();
    if (!text) {
      toast.error("Announcement cannot be empty");
      return;
    }
    if (text.length > 280) {
      toast.error("Keep announcements under 280 characters");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("announcements").insert({
      message: text,
      is_active: true,
      created_by: user?.id,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Announcement posted");
      setDraft("");
      q.refetch();
    }
  };

  const toggle = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from("announcements")
      .update({ is_active: !active })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(active ? "Hidden from site" : "Now showing on site");
      q.refetch();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement permanently?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Announcement deleted");
      q.refetch();
    }
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-foreground">Announcements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sitewide banner messages. Active announcements scroll across the top
          of every public page.
        </p>
      </header>

      <section className="mb-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">New announcement</h2>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. 🌟 Summer Sale: 20% off premium listings until June 30th"
          maxLength={280}
          className="mt-3 min-h-24"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {draft.length}/280
          </span>
          <Button onClick={create} disabled={submitting || !draft.trim()}>
            <Plus className="mr-1 h-4 w-4" /> Post announcement
          </Button>
        </div>
      </section>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        All announcements
      </h2>

      <div className="space-y-3">
        {q.data?.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4"
          >
            <Megaphone
              className={`h-5 w-5 shrink-0 ${
                a.is_active ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <p className="flex-1 text-sm text-foreground">{a.message}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(a.created_at).toLocaleDateString()}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {a.is_active ? "On" : "Off"}
              </span>
              <Switch
                checked={a.is_active}
                onCheckedChange={() => toggle(a.id, a.is_active)}
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => remove(a.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {q.data?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No announcements yet.
          </p>
        )}
      </div>
    </div>
  );
}
