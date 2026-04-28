import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LEBANESE_LOCATIONS } from "@/lib/lebanon";
import { supabase } from "@/integrations/supabase/client";
import { Save, X, ImagePlus, Loader2 } from "lucide-react";
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

type ExistingPhoto = {
  id: string;
  photo_url: string;
  display_order: number;
};

interface Props {
  open: boolean;
  listingId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AdminListingEditForm({ open, listingId, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [hostId, setHostId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<Category>("apartment");
  const [priceWeekday, setPriceWeekday] = useState("");
  const [priceWeekend, setPriceWeekend] = useState("");
  const [maxGuests, setMaxGuests] = useState("2");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [amenities, setAmenities] = useState<string[]>([]);

  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!open || !listingId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: l, error } = await supabase
          .from("listings")
          .select(
            "id, host_id, title, description, location, category, price_weekday, price_weekend, max_guests, bedrooms, bathrooms, amenities",
          )
          .eq("id", listingId)
          .single();
        if (error) throw error;

        const { data: photos, error: pErr } = await supabase
          .from("listing_photos")
          .select("id, photo_url, display_order")
          .eq("listing_id", listingId)
          .order("display_order", { ascending: true });
        if (pErr) throw pErr;

        if (cancelled) return;

        setHostId(l.host_id);
        setTitle(l.title);
        setDescription(l.description);
        setLocation(l.location);
        setCategory(l.category as Category);
        setPriceWeekday(String(l.price_weekday ?? ""));
        setPriceWeekend(String(l.price_weekend ?? ""));
        setMaxGuests(String(l.max_guests ?? 2));
        setBedrooms(String(l.bedrooms ?? 1));
        setBathrooms(String(l.bathrooms ?? 1));
        setAmenities(l.amenities ?? []);
        setExistingPhotos(photos ?? []);
        setPhotosToDelete([]);
        setNewFiles([]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load listing");
        onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, listingId, onClose]);

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    const remaining = 10 - (existingPhotos.length - photosToDelete.length) - newFiles.length;
    setNewFiles((prev) => [...prev, ...list].slice(0, prev.length + Math.max(0, remaining)));
    e.target.value = "";
  };

  const removeExistingPhoto = (id: string) =>
    setPhotosToDelete((prev) => (prev.includes(id) ? prev : [...prev, id]));

  const restoreExistingPhoto = (id: string) =>
    setPhotosToDelete((prev) => prev.filter((x) => x !== id));

  const removeNewFile = (idx: number) =>
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingId) return;
    if (!title || !description || !location || !priceWeekday || !priceWeekend) {
      toast.error("Fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const wd = Number(priceWeekday);
      const we = Number(priceWeekend);

      const { error: uErr } = await supabase
        .from("listings")
        .update({
          title: title.trim(),
          description: description.trim(),
          location,
          category,
          price_weekday: wd,
          price_weekend: we,
          price_per_night: Math.min(wd, we),
          max_guests: Number(maxGuests),
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          amenities,
        })
        .eq("id", listingId);
      if (uErr) throw uErr;

      if (photosToDelete.length > 0) {
        const { error: dErr } = await supabase
          .from("listing_photos")
          .delete()
          .in("id", photosToDelete);
        if (dErr) throw dErr;
      }

      if (newFiles.length > 0) {
        const baseOrder =
          existingPhotos.filter((p) => !photosToDelete.includes(p.id)).length;
        for (let i = 0; i < newFiles.length; i++) {
          const file = newFiles[i];
          const ext = file.name.split(".").pop() || "jpg";
          const path = `${hostId}/${listingId}/${Date.now()}-${i}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("listing-photos")
            .upload(path, file, { contentType: file.type, upsert: false });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from("listing-photos").getPublicUrl(path);
          const { error: phErr } = await supabase
            .from("listing_photos")
            .insert({
              listing_id: listingId,
              photo_url: pub.publicUrl,
              display_order: baseOrder + i,
            });
          if (phErr) throw phErr;
        }
      }

      toast.success("Listing updated");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update listing");
    } finally {
      setSubmitting(false);
    }
  };

  const visibleExisting = existingPhotos.filter((p) => !photosToDelete.includes(p.id));
  const totalPhotos = visibleExisting.length + newFiles.length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Edit listing</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="title">Listing title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="desc">Description *</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="loc">City / Location *</Label>
              <Input
                id="loc"
                list="city-suggestions-edit"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <datalist id="city-suggestions-edit">
                {LEBANESE_LOCATIONS.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </div>

            <div>
              <Label>Category *</Label>
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
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="pwd"
                    type="number"
                    min="0"
                    value={priceWeekday}
                    onChange={(e) => setPriceWeekday(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="pwe">Weekend price (USD) *</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="pwe"
                    type="number"
                    min="0"
                    value={priceWeekend}
                    onChange={(e) => setPriceWeekend(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="g">Max guests</Label>
                <Input
                  id="g"
                  type="number"
                  min="1"
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="b">Bedrooms</Label>
                <Input
                  id="b"
                  type="number"
                  min="0"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ba">Bathrooms</Label>
                <Input
                  id="ba"
                  type="number"
                  min="0"
                  step="0.5"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                />
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
              <p className="text-xs text-muted-foreground">
                Up to 10 photos. {totalPhotos}/10 currently.
              </p>

              {existingPhotos.length > 0 && (
                <div className="mt-2">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">
                    Existing photos
                  </p>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {existingPhotos.map((p) => {
                      const marked = photosToDelete.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`relative aspect-square overflow-hidden rounded-xl border ${
                            marked ? "border-destructive opacity-40" : "border-border"
                          }`}
                        >
                          <img
                            src={p.photo_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              marked ? restoreExistingPhoto(p.id) : removeExistingPhoto(p.id)
                            }
                            className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-xs shadow"
                            title={marked ? "Undo remove" : "Remove"}
                          >
                            {marked ? "↺" : <X className="h-3 w-3" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-3">
                {newFiles.length > 0 && (
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">
                    New uploads
                  </p>
                )}
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {newFiles.map((f, i) => (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-xl border border-border"
                    >
                      <img
                        src={URL.createObjectURL(f)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewFile(i)}
                        className="absolute right-1 top-1 rounded-full bg-background/90 p-1 shadow"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {totalPhotos < 10 && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition hover:border-primary hover:bg-accent">
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-xs">Add</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFiles}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                <Save className="h-4 w-4" />
                {submitting ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
