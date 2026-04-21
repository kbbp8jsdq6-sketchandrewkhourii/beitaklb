import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LEBANESE_LOCATIONS } from "@/lib/lebanon";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, X, ImagePlus } from "lucide-react";

export const Route = createFileRoute("/host/new")({
  head: () => ({ meta: [{ title: "List your place — BEITAK" }] }),
  component: NewListingPage,
});

const AMENITY_OPTIONS = [
  "Wi-Fi", "Air conditioning", "Heating", "Kitchen", "Pool", "Parking", "Washer",
  "Sea view", "Mountain view", "Garden", "Balcony", "BBQ", "Workspace", "TV",
];

function NewListingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<string>("");
  const [price, setPrice] = useState("");
  const [maxGuests, setMaxGuests] = useState("2");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [availFrom, setAvailFrom] = useState("");
  const [availTo, setAvailTo] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto mt-20 max-w-md text-center">
          <h1 className="font-display text-3xl">Log in to list your place</h1>
          <Button asChild className="mt-4"><Link to="/auth/login">Log in</Link></Button>
        </div>
      </div>
    );
  }

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...list].slice(0, 10));
  };

  const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !location || !price) {
      toast.error("Fill all required fields");
      return;
    }
    if (files.length === 0) {
      toast.error("Upload at least one photo");
      return;
    }
    setSubmitting(true);
    try {
      const { data: created, error: lErr } = await supabase
        .from("listings")
        .insert({
          host_id: user.id,
          title: title.trim(),
          description: description.trim(),
          location,
          price_per_night: Number(price),
          max_guests: Number(maxGuests),
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          amenities,
          available_from: availFrom || null,
          available_to: availTo || null,
        })
        .select("id")
        .single();
      if (lErr) throw lErr;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${created.id}/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("listing-photos")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("listing-photos").getPublicUrl(path);
        const { error: phErr } = await supabase
          .from("listing_photos")
          .insert({ listing_id: created.id, photo_url: pub.publicUrl, display_order: i });
        if (phErr) throw phErr;
      }

      toast.success("Listing published!");
      navigate({ to: "/listing/$id", params: { id: created.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl text-foreground">List your place</h1>
        <p className="mt-1 text-muted-foreground">Share your home with travellers across Lebanon.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="title">Listing title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cozy stone house in Bcharre" />
          </div>
          <div>
            <Label htmlFor="desc">Description *</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Tell guests what makes your place special…" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Location (Lebanon) *</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger><SelectValue placeholder="Pick a city or village" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {LEBANESE_LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price">Price per night (USD) *</Label>
              <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="120" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="g">Max guests</Label>
              <Input id="g" type="number" min="1" value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="b">Bedrooms</Label>
              <Input id="b" type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ba">Bathrooms</Label>
              <Input id="ba" type="number" min="0" step="0.5" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from">Available from</Label>
              <Input id="from" type="date" value={availFrom} onChange={(e) => setAvailFrom(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="to">Available to</Label>
              <Input id="to" type="date" value={availTo} min={availFrom || undefined} onChange={(e) => setAvailTo(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Amenities</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => {
                const active = amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Photos *</Label>
            <p className="text-xs text-muted-foreground">Up to 10 photos. First photo is the cover.</p>
            <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {files.map((f, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute right-1 top-1 rounded-full bg-background/90 p-1 shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">COVER</span>}
                </div>
              ))}
              {files.length < 10 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition hover:border-primary hover:bg-accent">
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs">Add photos</span>
                  <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
            <Upload className="h-4 w-4" />
            {submitting ? "Publishing…" : "Publish listing"}
          </Button>
        </form>
      </main>
    </div>
  );
}
