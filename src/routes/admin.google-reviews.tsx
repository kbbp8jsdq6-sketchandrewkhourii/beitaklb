import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Save, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/google-reviews")({
  head: () => ({ meta: [
    { title: "Google Reviews - Admin - BEITAK" },
    { name: "description", content: "Manage the real Google reviews displayed on Beitak's homepage." },
    { property: "og:title", content: "Google Reviews - Admin - BEITAK" },
    { property: "og:description", content: "Manage Beitak's homepage Google reviews." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: AdminGoogleReviewsPage,
});

type Review = Database["public"]["Tables"]["google_reviews"]["Row"];
type Form = Pick<Review, "guest_name" | "rating" | "review_text" | "featured"> & { property_name: string };
const EMPTY: Form = { guest_name: "", rating: 5, review_text: "", property_name: "", featured: false };

function AdminGoogleReviewsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["admin-google-reviews"], queryFn: async () => {
    const { data, error } = await supabase.from("google_reviews").select("*").order("display_order").order("created_at");
    if (error) throw error;
    return data ?? [];
  } });
  const reviews = q.data ?? [];
  const refresh = async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-google-reviews"] }), queryClient.invalidateQueries({ queryKey: ["google-reviews"] })]); };
  const patch = (update: Partial<Form>) => setForm(current => ({ ...current, ...update }));
  const close = () => { setShowForm(false); setEditing(null); setForm(EMPTY); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.guest_name.trim() || !form.review_text.trim()) return;
    setBusy(true);
    try {
      const values = { ...form, guest_name: form.guest_name.trim(), review_text: form.review_text.trim(), property_name: form.property_name.trim() || null };
      const result = editing
        ? await supabase.from("google_reviews").update(values).eq("id", editing).select("id").single()
        : await supabase.from("google_reviews").insert({ ...values, display_order: Math.max(-1, ...reviews.map(r => r.display_order)) + 1 }).select("id").single();
      if (result.error) throw result.error;
      toast.success(editing ? "Review updated" : "Review added");
      close(); await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save review"); }
    finally { setBusy(false); }
  };
  const feature = async (review: Review, value: boolean) => {
    setBusy(true);
    try {
      const { error } = await supabase.from("google_reviews").update({ featured: value }).eq("id", review.id).select("id").single();
      if (error) throw error;
      await refresh(); toast.success(value ? "Featured review updated" : "Featured review cleared");
    } catch { toast.error("Could not update featured review"); } finally { setBusy(false); }
  };
  const move = async (index: number, direction: number) => {
    const ids = reviews.map(r => r.id); const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    const current = ids[index]; const other = ids[target];
    if (!current || !other) return;
    ids[index] = other; ids[target] = current;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("reorder_google_reviews", { review_ids: ids });
      if (error) throw error;
      await refresh();
    } catch { toast.error("Could not reorder reviews. Reload and try again."); } finally { setBusy(false); }
  };
  const remove = async (review: Review) => {
    if (!confirm(`Delete the review by ${review.guest_name} permanently?`)) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("google_reviews").delete().eq("id", review.id).select("id").single();
      if (error) throw error;
      if (editing === review.id) close();
      await refresh(); toast.success("Review deleted");
    } catch { toast.error("Could not delete review"); } finally { setBusy(false); }
  };
  return <div className="max-w-5xl">
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-display text-3xl">Google Reviews</h1><p className="mt-1 text-sm text-muted-foreground">Real Google reviews displayed on the homepage.</p></div><Button disabled={busy} onClick={() => { close(); setShowForm(true); }}><Plus aria-hidden="true" />Add review</Button></header>
    {showForm && <form onSubmit={save} className="mb-6 space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between"><h2 className="font-display text-2xl">{editing ? "Edit review" : "Add review"}</h2><Button type="button" variant="ghost" size="icon" aria-label="Close review form" onClick={close} disabled={busy}><X /></Button></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="guest-name">Guest name</Label><Input id="guest-name" required maxLength={150} value={form.guest_name} onChange={e => patch({ guest_name: e.target.value })} className="mt-1" /></div><div><Label htmlFor="property-name">Property name (optional)</Label><Input id="property-name" maxLength={200} value={form.property_name} onChange={e => patch({ property_name: e.target.value })} className="mt-1" /></div></div>
      <div><Label>Star rating</Label><div className="mt-2 flex gap-1" role="group" aria-label="Star rating">{[1, 2, 3, 4, 5].map(rating => <Button key={rating} type="button" size="icon" variant="ghost" aria-label={`${rating} ${rating === 1 ? "star" : "stars"}`} aria-pressed={form.rating === rating} onClick={() => patch({ rating })}><Star className={rating <= form.rating ? "fill-primary text-primary" : "text-muted-foreground"} /></Button>)}</div></div>
      <div><Label htmlFor="review-text">Review text</Label><Textarea id="review-text" required maxLength={10000} rows={5} value={form.review_text} onChange={e => patch({ review_text: e.target.value })} className="mt-1 text-base" /></div>
      <div className="flex items-center gap-3"><Switch id="featured-review" checked={form.featured} onCheckedChange={featured => patch({ featured })} /><Label htmlFor="featured-review">Featured review</Label></div>
      <Button type="submit" disabled={busy || !form.guest_name.trim() || !form.review_text.trim()}><Save />{busy ? "Saving..." : "Save review"}</Button>
    </form>}
    {q.isPending && <p className="text-sm text-muted-foreground">Loading reviews...</p>}
    {q.isError && <div role="alert" className="text-sm text-destructive">Could not load reviews. <Button variant="ghost" onClick={() => q.refetch()}>Try again</Button></div>}
    {!q.isPending && !q.isError && reviews.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No Google reviews added yet.</div>}
    <div className="space-y-3">{reviews.map((review, index) => <article key={review.id} className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap justify-between gap-3"><div className="min-w-0"><p className="break-words font-semibold">{review.guest_name}</p>{review.property_name && <p className="mt-1 text-xs text-muted-foreground">Stayed at {review.property_name}</p>}<div className="mt-2 flex gap-1" role="img" aria-label={`Rated ${review.rating} out of 5`}>{[1, 2, 3, 4, 5].map(i => <Star key={i} className={`h-3.5 w-3.5 text-primary ${i <= review.rating ? "fill-primary" : "fill-none"}`} />)}</div></div>
      <div className="flex flex-wrap items-center gap-1"><Label htmlFor={`featured-${review.id}`} className="mr-1 text-xs">Featured</Label><Switch id={`featured-${review.id}`} checked={review.featured} disabled={busy} onCheckedChange={value => feature(review, value)} /><Button variant="ghost" size="icon" title="Move up" aria-label={`Move ${review.guest_name} up`} disabled={busy || index === 0} onClick={() => move(index, -1)}><ArrowUp /></Button><Button variant="ghost" size="icon" title="Move down" aria-label={`Move ${review.guest_name} down`} disabled={busy || index === reviews.length - 1} onClick={() => move(index, 1)}><ArrowDown /></Button><Button variant="ghost" size="icon" title="Edit review" aria-label={`Edit ${review.guest_name}`} disabled={busy} onClick={() => { setEditing(review.id); setForm({ guest_name: review.guest_name, review_text: review.review_text, rating: review.rating, property_name: review.property_name ?? "", featured: review.featured }); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil /></Button><Button variant="ghost" size="icon" title="Delete review" className="text-destructive" aria-label={`Delete ${review.guest_name}`} disabled={busy} onClick={() => remove(review)}><Trash2 /></Button></div></div>
      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">{review.review_text}</p>
    </article>)}</div>
  </div>;
}
