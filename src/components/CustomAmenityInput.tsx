import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  /** Default (built-in) amenity options — used to avoid duplicates with the built-in list. */
  defaultOptions: string[];
  /** All currently-selected amenities (built-in + custom mixed). */
  value: string[];
  onChange: (next: string[]) => void;
}

/**
 * Lets a host or admin type any custom amenity name and add it as a chip.
 * Custom amenities are simply appended to the existing amenities array on the listing,
 * so they are linked to the listing by listing_id and flow into search & detail views automatically.
 */
export function CustomAmenityInput({ defaultOptions, value, onChange }: Props) {
  const [draft, setDraft] = useState("");

  const defaultsLower = new Set(defaultOptions.map((d) => d.toLowerCase()));
  const customAmenities = value.filter((a) => !defaultsLower.has(a.toLowerCase()));

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (trimmed.length > 40) return;
    const exists = value.some((a) => a.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  };

  const remove = (a: string) => {
    onChange(value.filter((x) => x !== a));
  };

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-foreground">Add Custom Amenity</p>
      <p className="text-xs text-muted-foreground">
        Add anything not in the list above (e.g. “Mountain view”, “Outdoor cinema”).
      </p>
      <div className="mt-2 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Type a custom amenity…"
          maxLength={40}
        />
        <Button type="button" onClick={add} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
      {customAmenities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {customAmenities.map((a) => (
            <span
              key={a}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-3 py-1 text-sm text-foreground"
            >
              {a}
              <button
                type="button"
                onClick={() => remove(a)}
                aria-label={`Remove ${a}`}
                className="rounded-full p-0.5 transition hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
