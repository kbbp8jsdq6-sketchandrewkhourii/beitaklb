import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LEBANESE_LOCATIONS } from "@/lib/lebanon";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, ImagePlus } from "lucide-react";
import { CustomAmenityInput } from "@/components/CustomAmenityInput";
import { FieldError } from "@/components/FieldError";
import { listingSchema, fieldErrors, sanitizeLine, stripHtml, friendlyError, validateImageFile } from "@/lib/validation";

const AMENITY_OPTIONS = [
  "Pool",
  "Gym",
  "Parking",
  "Pet Friendly",
  "Washer/Dryer",
  "Balcony",
  "AC",
  "BBQ Area",
  "Beach Access",
  "Chimney",
  "Jacuzzi",
  "Wheelchair Accessibility",
  "Breakfast included",
  "Electricity 24/7",
  "High speed WiFi",
  "Smart TV & streaming services",
  "Hot water",
];

type Category = "villa" | "cabin" | "apartment";
const CATEGORIES: { value: Category; label: string }[] = [
  { value: "villa", label: "Villa" },
  { value: "cabin", label: "Cabin" },
  { value: "apartment", label: "Apartment" },
];

const DISTRICTS = [
  "Batroun",
  "Chouf",
  "Aley",
  "Maten",
  "Keserwan",
  "North Lebanon",
  "Byblos",
  "Baabda",
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
  const [category, setCategory] = useState<Category>("apartment");
  const [priceWeekday, setPriceWeekday] = useState("");
  const [priceWeekend, setPriceWeekend] = useState("");
  const [maxGuests, setMaxGuests] = useState("2");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setTitle(""); setDescription(""); setLocation(""); setCategory("apartment");
    setPriceWeekday(""); setPriceWeekend("");
    setMaxGuests("2"); setBedrooms("1"); setBathrooms("1");
    setAmenities([]); setFiles([]);
  };

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    const valid: File[] = [];
    for (const f of list) {
      const err = validateImageFile(f);
      if (err) {
        toast.error(err);
        continue;
      }
      valid.push(f);
    }
    setFiles((prev) => [...prev, ...valid].slice(0, 10));
    e.target.value = "";
  };

  const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanTitle = sanitizeLine(title);
    const cleanDesc = stripHtml(description);
    const cleanLoc = sanitizeLine(location);
    const wd = Number(priceWeekday);
    const we = Number(priceWeekend);

    const parsed = listingSchema.safeParse({
      title: cleanTitle,
      description: cleanDesc,
      location: cleanLoc,
      priceWeekday: wd,
      priceWeekend: we,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const insertPayload = {
        host_id: adminUserId,
        title: parsed.data.title,
        description: parsed.data.description,
        location: parsed.data.location,
        category,
        price_per_night: Math.min(wd, we),
        price_weekday: wd,
        price_weekend: we,
        max_guests: Number(maxGuests),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        amenities,
        is_active: true,
      };
      const { data: created, error: lErr } = await supabase
        .from("listings")
        .insert(insertPayload)
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
      toast.error(friendlyError(err, "Failed to create listing"));
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
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} aria-invalid={!!errors.title} placeholder="Cozy stone house in Bcharre" />
            <FieldError message={errors.title} />
          </div>
          <div>
            <Label htmlFor="desc">Description *</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={1000} aria-invalid={!!errors.description} placeholder="Tell guests what makes your place special…" />
            <FieldError message={errors.description} />
          </div>

          <div>
            <Label htmlFor="loc">City / Location *</Label>
            <Input
              id="loc"
              list="city-suggestions"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={120}
              aria-invalid={!!errors.location}
              placeholder="e.g. Bcharre, Beirut, Tyre…"
            />
            <datalist id="city-suggestions">
              {LEBANESE_LOCATIONS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
            <FieldError message={errors.location} />
            <p className="mt-1 text-xs text-muted-foreground">
              Pick a suggestion or type any new city — it will appear in the search filter automatically.
            </p>
          </div>

          <div>
            <Label htmlFor="cat">Category *</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => {
                const active = category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pwd">Weekday price (USD) *</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input id="pwd" type="number" min="1" max="3000" step="1" value={priceWeekday} onChange={(e) => setPriceWeekday(e.target.value)} placeholder="120" className="pl-7" aria-invalid={!!errors.priceWeekday} />
              </div>
              <FieldError message={errors.priceWeekday} />
            </div>
            <div>
              <Label htmlFor="pwe">Weekend price (USD) *</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input id="pwe" type="number" min="1" max="3000" step="1" value={priceWeekend} onChange={(e) => setPriceWeekend(e.target.value)} placeholder="180" className="pl-7" aria-invalid={!!errors.priceWeekend} />
              </div>
              <FieldError message={errors.priceWeekend} />
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
            <CustomAmenityInput
              defaultOptions={AMENITY_OPTIONS}
              value={amenities}
              onChange={setAmenities}
            />
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
                  <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple onChange={handleFiles} className="hidden" />
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
