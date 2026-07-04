import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/image-compress";

export const Route = createFileRoute("/admin/hero-images")({
  head: () => ({
    meta: [
      { title: "Hero Images — Admin — BEITAK" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminHeroImagesPage,
});

const BUCKET = "hero";


type HeroFile = { name: string; url: string };


function AdminHeroImagesPage() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<HeroFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure bucket exists (idempotent — ignore if already there)
  useEffect(() => {
    supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});
  }, []);

  const filesQ = useQuery({
    queryKey: ["admin-hero-images"],
    queryFn: async (): Promise<HeroFile[]> => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list("", { limit: 200, sortBy: { column: "name", order: "asc" } });
      if (error) throw error;
      const files = (data ?? []).filter((f) => f.name && !f.name.startsWith("."));
      return files.map((f) => {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(f.name);
        return { name: f.name, url: data.publicUrl };
      });
    },
  });

  // Sync order with fetched files, preserving any manual reordering
  useEffect(() => {
    if (!filesQ.data) return;
    setOrder((prev) => {
      const byName = new Map(filesQ.data!.map((f) => [f.name, f]));
      const kept = prev.filter((f) => byName.has(f.name)).map((f) => byName.get(f.name)!);
      const newOnes = filesQ.data!.filter((f) => !prev.some((p) => p.name === f.name));
      return [...kept, ...newOnes];
    });
  }, [filesQ.data]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    try {
      for (const file of files) {
        try {
          const blob = await compressImage(file, { maxWidth: 1920, quality: 0.82 });
          const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
          const fileName = `${Date.now()}_${base}.webp`;
          const { error } = await supabase.storage
            .from(BUCKET)
            .upload(fileName, blob, { upsert: true, contentType: "image/webp" });
          if (error) throw error;
        } catch (err) {
          toast.error(`Failed to upload ${file.name}: ${(err as Error).message}`);
        }
      }
      toast.success("Upload complete");
      qc.invalidateQueries({ queryKey: ["admin-hero-images"] });
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`Delete ${name}?`)) return;
    const { error } = await supabase.storage.from(BUCKET).remove([name]);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-hero-images"] });
  }

  function move(idx: number, dir: -1 | 1) {
    setOrder((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  async function handleSaveOrder() {
    setSaving(true);
    try {
      const { error: delErr } = await supabase.from("hero_images").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (delErr) throw delErr;
      if (order.length > 0) {
        const rows = order.map((f, i) => ({ url: f.url, display_order: i }));
        const { error: insErr } = await supabase.from("hero_images").insert(rows);
        if (insErr) throw insErr;
      }
      toast.success("Order saved — homepage slideshow updated");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl">Hero Images</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload, reorder, and publish the homepage hero slideshow. Images are
          compressed to WebP at max 1920px wide before upload.
        </p>
      </header>

      <div className="glass flex flex-wrap items-center gap-3 rounded-xl p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          disabled={busy}
          className="hidden"
          id="hero-file-input"
        />
        <Button asChild disabled={busy}>
          <label htmlFor="hero-file-input" className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            {busy ? "Uploading…" : "Upload images"}
          </label>
        </Button>
        <Button onClick={handleSaveOrder} disabled={saving || order.length === 0} variant="default">
          {saving ? "Saving…" : "Save order"}
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          {order.length} image{order.length === 1 ? "" : "s"}
        </span>
      </div>

      {filesQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filesQ.error ? (
        <p className="text-sm text-destructive">
          Failed to load: {(filesQ.error as Error).message}
        </p>
      ) : order.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hero images yet. Upload your first one above.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {order.map((f, idx) => (
            <li key={f.name} className="glass overflow-hidden rounded-xl">
              <div className="relative aspect-video bg-muted">
                {f.url ? (
                  <img
                    src={f.url}
                    alt={f.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
                  #{idx + 1}
                </span>
              </div>
              <div className="flex items-center gap-2 p-3">
                <span className="flex-1 truncate text-xs text-muted-foreground">{f.name}</span>
                <Button size="icon" variant="ghost" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Move up">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => move(idx, 1)} disabled={idx === order.length - 1} aria-label="Move down">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(f.name)} aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
