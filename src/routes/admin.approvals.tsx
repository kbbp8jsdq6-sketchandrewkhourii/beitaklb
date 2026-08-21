import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/approvals")({
  head: () => ({
    meta: [
      { title: "Approvals - Admin - BEITAK" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminApprovalsPage,
});

function AdminApprovalsPage() {
  const { user } = useAuth();
  const [rejecting, setRejecting] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pendingQ = useQuery({
    queryKey: ["admin-approvals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(
          "id, title, location, category, price_per_night, created_at, host_id, profiles:host_id(full_name, phone)",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const approve = async (id: string) => {
    const { error } = await supabase
      .from("listings")
      .update({
        status: "approved",
        rejection_note: null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
      })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Listing approved");
      pendingQ.refetch();
    }
  };

  const submitRejection = async () => {
    if (!rejecting) return;
    if (!rejectionNote.trim()) {
      toast.error("Please write a reason for the rejection.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("listings")
      .update({
        status: "rejected",
        rejection_note: rejectionNote.trim(),
        is_active: false,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
      })
      .eq("id", rejecting.id);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listing rejected - note saved to host");
    setRejecting(null);
    setRejectionNote("");
    pendingQ.refetch();
  };

  const items = pendingQ.data ?? [];

  return (
    <div>
      <header className="mb-6">
        <h1 className="flex items-center gap-2 font-display text-3xl text-foreground">
          <ClipboardCheck className="h-7 w-7 text-primary" />
          Approval queue
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Listings waiting for admin approval before going live.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No pending listings - you're all caught up.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {items.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <Link
                  to="/listing/$id"
                  params={{ id: l.id }}
                  className="font-display text-lg hover:text-primary"
                >
                  {l.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {l.profiles?.full_name ?? "Unknown host"} •{" "}
                  <span className="capitalize">{l.category}</span> • {l.location}{" "}
                  • ${Number(l.price_per_night).toFixed(0)}/night
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submitted {new Date(l.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-destructive"
                  onClick={() => {
                    setRejecting({ id: l.id, title: l.title });
                    setRejectionNote("");
                  }}
                >
                  <X className="h-4 w-4" /> Reject
                </Button>
                <Button size="sm" className="gap-1" onClick={() => approve(l.id)}>
                  <Check className="h-4 w-4" /> Approve
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject "{rejecting?.title}"</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Write a clear reason. The host will see this note when they view
            their listing.
          </p>
          <Textarea
            value={rejectionNote}
            onChange={(e) => setRejectionNote(e.target.value)}
            rows={5}
            placeholder="e.g. Photos are too low resolution. Please re-upload sharper images."
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitRejection}
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Reject listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
