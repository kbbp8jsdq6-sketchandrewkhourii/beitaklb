import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEBANESE_LOCATIONS } from "@/lib/lebanon";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, ImagePlus } from "lucide-react";

const AMENITY_OPTIONS = [
  "Wi-Fi", "Air conditioning", "Heating", "Kitchen", "Pool", "Parking", "Washer",
  "Sea view", "Mountain view", "Garden", "Balcony", "BBQ", "Workspace", "TV",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  adminUserId: string;
}

export function AdminListingForm({ open, onClose, onCreated, adminUserId }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<string>("");
  const [price, setPrice] = useState("");
  const [maxGuests, setMaxGuests] = useState("2");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle(""); setDescription(""); setLocation(""); setPrice("");
    setMaxGuests("2"); setBedrooms("1"); setBathrooms("1");
    setAmenities([]); setFiles([]);
  };

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

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
    setSubmitting(true);
    try {
      const { data: created, error: lErr } = await supabase
        .from("listings")
        .insert({
          host_id: adminUserId,
          title: title.trim(),
          description: description.trim(),
          location,
          price_per_night: Number(price),
          max_guests: Number(maxGuests),
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          amenities,
          is_active: true,
        })
        .select("id")
        .single();
      if (lErr) throw lErr;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${adminUserId}/${created.id}/${Date.now()}-${i}.${ext}`;
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
      reset();
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add new listing</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="title">Listing title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cozy stone house in Bcharre" />
          </div>
          <div>
            <Label htmlFor="desc">Description *</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Tell guests what makes your place special…" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>City / Location *</Label>
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
              <Label htmlFor="price">Price / night (USD) *</Label>
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
            <Label>Photos</Label>
            <p className="text-xs text-muted-foreground">Up to 10 photos. First is the cover.</p>
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
                  <span className="text-xs">Add</span>
                  <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
              <Upload className="h-4 w-4" />
              {submitting ? "Publishing…" : "Publish listing"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
