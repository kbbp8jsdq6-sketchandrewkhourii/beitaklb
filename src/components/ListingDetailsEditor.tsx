import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { STAY_TYPES, type ConversionResult, type ListingDetails } from "@/lib/listing-details";

export const WARN_CLASS = "border-amber-400 ring-1 ring-amber-300 focus-visible:ring-amber-400";

/** Paste box + AI convert button + yellow warnings list. Nothing is saved here. */
export function ConvertDescriptionBox({
  text,
  onTextChange,
  onConverted,
  warnings,
}: {
  text: string;
  onTextChange: (v: string) => void;
  onConverted: (r: ConversionResult) => void;
  warnings: string[];
}) {
  const [busy, setBusy] = useState(false);
  const convert = async () => {
    if (text.trim().length < 10) {
      toast.error("Paste the owner's description first");
      return;
    }
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/convert-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify({ text }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Conversion failed");
      onConverted(body as ConversionResult);
      toast.success("Fields filled in. Review them, then click Save.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <Label htmlFor="owner-desc">Paste the owner's description</Label>
      <Textarea
        id="owner-desc"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        rows={5}
        maxLength={6000}
        placeholder="Paste the text the owner sent you…"
        className="mt-1 bg-card"
      />
      <p className="mt-1 text-xs text-muted-foreground">Kept for admins only. Never shown on the site.</p>
      <Button type="button" onClick={convert} disabled={busy} className="mt-3 gap-2">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? "Converting…" : "Convert description"}
      </Button>
      {warnings.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          {warnings.map((w, i) => (
            <li key={i}>• {w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

const numVal = (v: number | null) => (v == null ? "" : String(v));
const toNum = (s: string) => {
  const n = Number(s);
  return s.trim() === "" || !Number.isFinite(n) || n <= 0 ? null : n;
};
const toStr = (s: string) => (s.trim() ? s : null);

/** All structured detail fields, always visible even when empty. */
export function ListingDetailsFields({
  value,
  onChange,
  amenities,
  warn,
}: {
  value: ListingDetails;
  onChange: (next: ListingDetails) => void;
  amenities: string[];
  warn: Set<string>;
}) {
  const set = <K extends keyof ListingDetails>(k: K, v: ListingDetails[K]) => onChange({ ...value, [k]: v });
  const w = (k: string) => (warn.has(k) ? WARN_CLASS : "");
  const [hl, setHl] = useState("");
  const [rateName, setRateName] = useState("");
  const [ratePrice, setRatePrice] = useState("");

  const numField = (k: keyof ListingDetails, label: string, prefix?: string) => (
    <div>
      <Label htmlFor={`d-${k}`}>{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>
        )}
        <Input
          id={`d-${k}`}
          type="number"
          min="0"
          value={numVal(value[k] as number | null)}
          onChange={(e) => set(k, toNum(e.target.value) as never)}
          className={`${prefix ? "pl-7" : ""} ${w(k)}`}
        />
      </div>
    </div>
  );
  const textField = (k: keyof ListingDetails, label: string, placeholder?: string) => (
    <div>
      <Label htmlFor={`d-${k}`}>{label}</Label>
      <Input
        id={`d-${k}`}
        value={(value[k] as string | null) ?? ""}
        onChange={(e) => set(k, toStr(e.target.value) as never)}
        placeholder={placeholder}
        maxLength={k === "check_in_time" || k === "check_out_time" ? 40 : 200}
        className={w(k)}
      />
    </div>
  );

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <p className="font-display text-xl">Listing details</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {numField("min_guests", "Minimum guests")}
        {numField("kitchens", "Kitchens")}
        {textField("bedroom_details", "Bedroom details", "e.g. 3 master + 3 double")}
        {textField("bathroom_details", "Bathroom details", "e.g. + 1 guest toilet")}
        {numField("living_area_m2", "Living area (m²)")}
        <div />
        {textField("check_in_time", "Check-in time", "e.g. 2:00 PM")}
        {textField("check_out_time", "Check-out time", "e.g. 12:00 PM")}
      </div>

      <div>
        <Label>Stay type</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {STAY_TYPES.map((t) => {
            const on = value.stay_types.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => set("stay_types", on ? value.stay_types.filter((x) => x !== t) : [...value.stay_types, t])}
                className={`rounded-full border px-3 py-1.5 text-sm capitalize transition ${
                  on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {numField("extra_guest_fee_weekday", "Extra guest fee weekday", "$")}
        {numField("extra_guest_fee_weekend", "Extra guest fee weekend", "$")}
        {numField("extra_guest_after", "Charged after how many guests")}
      </div>

      <div>
        <Label>Other rates</Label>
        {value.other_rates.length > 0 && (
          <ul className="mt-2 space-y-1">
            {value.other_rates.map((r, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
                <span>{r.name}</span>
                <span className="flex items-center gap-2">
                  ${r.price.toLocaleString()}
                  <button type="button" aria-label={`Remove ${r.name}`} onClick={() => set("other_rates", value.other_rates.filter((_, j) => j !== i))}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex gap-2">
          <Input value={rateName} onChange={(e) => setRateName(e.target.value)} placeholder="Name, e.g. Monthly" maxLength={60} />
          <Input type="number" min="1" value={ratePrice} onChange={(e) => setRatePrice(e.target.value)} placeholder="Price" className="w-32" />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const p = toNum(ratePrice);
              if (!rateName.trim() || !p) return;
              set("other_rates", [...value.other_rates, { name: rateName.trim(), price: p }]);
              setRateName("");
              setRatePrice("");
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <Label>Highlights</Label>
        {value.highlights.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {value.highlights.map((h, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                {h}
                <button type="button" aria-label={`Remove ${h}`} onClick={() => set("highlights", value.highlights.filter((_, j) => j !== i))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <Input
            value={hl}
            onChange={(e) => setHl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (hl.trim()) set("highlights", [...value.highlights, hl.trim()]);
                setHl("");
              }
            }}
            placeholder="e.g. Sea & mountain views"
            maxLength={80}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (hl.trim()) set("highlights", [...value.highlights, hl.trim()]);
              setHl("");
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {amenities.length > 0 && (
        <div>
          <Label>Amenity details (optional)</Label>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {amenities.map((a) => (
              <div key={a}>
                <p className="text-xs font-medium text-muted-foreground">{a}</p>
                <Input
                  value={value.amenity_details[a] ?? ""}
                  maxLength={120}
                  placeholder="Detail line"
                  onChange={(e) => {
                    const next = { ...value.amenity_details };
                    if (e.target.value.trim()) next[a] = e.target.value;
                    else delete next[a];
                    set("amenity_details", next);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="d-about">About this place</Label>
        <Textarea
          id="d-about"
          value={value.about ?? ""}
          onChange={(e) => set("about", toStr(e.target.value))}
          rows={4}
          maxLength={999}
          className={w("about")}
        />
      </div>
    </div>
  );
}

/** Payload for the listings table from the details model. */
export function detailsPayload(d: ListingDetails, amenities: string[]) {
  const amenity_details = Object.fromEntries(
    Object.entries(d.amenity_details).filter(([k, v]) => amenities.includes(k) && v.trim()).map(([k, v]) => [k, v.trim()]),
  );
  return {
    min_guests: d.min_guests,
    bedroom_details: d.bedroom_details?.trim() || null,
    bathroom_details: d.bathroom_details?.trim() || null,
    kitchens: d.kitchens,
    living_area_m2: d.living_area_m2,
    check_in_time: d.check_in_time?.trim() || null,
    check_out_time: d.check_out_time?.trim() || null,
    stay_types: d.stay_types,
    extra_guest_fee_weekday: d.extra_guest_fee_weekday,
    extra_guest_fee_weekend: d.extra_guest_fee_weekend,
    extra_guest_after: d.extra_guest_after,
    other_rates: d.other_rates,
    highlights: d.highlights,
    amenity_details,
    about: d.about?.trim().slice(0, 999) || null,
  };
}
