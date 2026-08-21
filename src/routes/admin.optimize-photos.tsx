import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/image-compress";

export const Route = createFileRoute("/admin/optimize-photos")({
  head: () => ({
    meta: [
      { title: "Optimize Photos - Admin - BEITAK" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OptimizePhotosPage,
});

const BUCKET = "listing-photos";

type PhotoRow = { id: string; photo_url: string; listing_id: string };

function isOptimized(url: string) {
  try {
    const clean = url.split("?")[0].toLowerCase();
    return clean.endsWith(".webp");
  } catch {
    return false;
  }
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/** Derive the storage object path (inside the bucket) from a public URL. */
function pathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
}

function OptimizePhotosPage() {
  const [rows, setRows] = useState<PhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const [processedIdx, setProcessedIdx] = useState(0);
  const [current, setCurrent] = useState<string>("");
  const [bytesBefore, setBytesBefore] = useState(0);
  const [bytesAfter, setBytesAfter] = useState(0);
  const [errors, setErrors] = useState<{ id: string; msg: string }[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("listing_photos")
        .select("id, photo_url, listing_id");
      if (error) toast.error(error.message);
      setRows((data ?? []) as PhotoRow[]);
      setLoading(false);
    })();
  }, []);

  const { optimized, remaining } = useMemo(() => {
    const opt = rows.filter((r) => isOptimized(r.photo_url));
    const rem = rows.filter((r) => !isOptimized(r.photo_url));
    return { optimized: opt, remaining: rem };
  }, [rows]);

  async function processOne(row: PhotoRow) {
    const path = pathFromPublicUrl(row.photo_url);
    if (!path) throw new Error("Could not derive storage path from URL");
    setCurrent(path);

    const res = await fetch(row.photo_url);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const origBlob = await res.blob();
    const origSize = origBlob.size;

    const compressed = await compressImage(origBlob, { maxWidth: 1600, quality: 0.8 });
    const newPath = path.replace(/\.[^./]+$/, "") + ".webp";

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(newPath, compressed, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(newPath);
    const { error: updErr } = await supabase
      .from("listing_photos")
      .update({ photo_url: pub.publicUrl })
      .eq("id", row.id);
    if (updErr) throw updErr;

    setBytesBefore((b) => b + origSize);
    setBytesAfter((b) => b + compressed.size);
    // Update in-memory row so it's now considered optimized
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, photo_url: pub.publicUrl } : r)),
    );
  }

  async function start() {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setDone(false);
    // Snapshot the current remaining list so pause/resume traverses stable indexes
    const queue = rows.filter((r) => !isOptimized(r.photo_url));
    for (let i = 0; i < queue.length; i++) {
      if (!runningRef.current) break;
      setProcessedIdx(i);
      const row = queue[i];
      try {
        await processOne(row);
      } catch (err) {
        setErrors((e) => [...e, { id: row.id, msg: (err as Error).message }]);
      }
    }
    setProcessedIdx(queue.length);
    runningRef.current = false;
    setRunning(false);
    setCurrent("");
    setDone(true);
  }

  function pause() {
    runningRef.current = false;
    setRunning(false);
  }

  const total = rows.length;
  const alreadyCount = optimized.length;
  const remainingCount = remaining.length;
  const progressPct = remainingCount === 0 ? 100 : Math.round((processedIdx / remainingCount) * 100);
  const saved = bytesBefore - bytesAfter;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl">Optimize Photos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Re-compress existing listing photos to WebP (max 1600px). Originals
          are kept as backups. Safe to leave and resume later.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="glass grid grid-cols-3 gap-4 rounded-xl p-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-2xl font-semibold">{total}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Already optimized</div>
              <div className="text-2xl font-semibold">{alreadyCount}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Remaining</div>
              <div className="text-2xl font-semibold">{remainingCount}</div>
            </div>
          </div>

          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              {running ? (
                <Button onClick={pause} variant="secondary">
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </Button>
              ) : (
                <Button onClick={start} disabled={remainingCount === 0}>
                  <Play className="mr-2 h-4 w-4" />
                  {processedIdx > 0 && !done ? "Resume" : "Start optimizing"}
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                {processedIdx} of {remainingCount}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {current ? (
              <div className="truncate text-xs text-muted-foreground">
                Current: {current}
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground">Before</div>
                <div className="font-medium">{fmtBytes(bytesBefore)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">After</div>
                <div className="font-medium">{fmtBytes(bytesAfter)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Saved</div>
                <div className="font-medium text-green-600">
                  {saved > 0 ? fmtBytes(saved) : "-"}
                </div>
              </div>
            </div>
          </div>

          {done && errors.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-green-600">
              Done - all remaining photos optimized.
            </p>
          ) : null}

          {errors.length > 0 ? (
            <div className="glass rounded-xl p-4">
              <h2 className="mb-2 text-sm font-semibold">
                Errors ({errors.length})
              </h2>
              <ul className="max-h-64 space-y-1 overflow-auto text-xs text-destructive">
                {errors.map((e, i) => (
                  <li key={i}>
                    <span className="font-mono">{e.id}</span>: {e.msg}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
