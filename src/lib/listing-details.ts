// Shared structured-listing-details model: types, amenity list, AI prompt, normalization and flag rules.
// Pure module (no secrets) so it can run in the browser, the server route and the one-off backfill script.

export const AMENITY_OPTIONS = [
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

export const STAY_TYPES = ["overnight", "day use", "events"] as const;

export type OtherRate = { name: string; price: number };

export type ListingDetails = {
  min_guests: number | null;
  bedroom_details: string | null;
  bathroom_details: string | null;
  kitchens: number | null;
  living_area_m2: number | null;
  check_in_time: string | null;
  check_out_time: string | null;
  stay_types: string[];
  extra_guest_fee_weekday: number | null;
  extra_guest_fee_weekend: number | null;
  extra_guest_after: number | null;
  other_rates: OtherRate[];
  highlights: string[];
  amenity_details: Record<string, string>;
  about: string | null;
};

export const EMPTY_DETAILS: ListingDetails = {
  min_guests: null,
  bedroom_details: null,
  bathroom_details: null,
  kitchens: null,
  living_area_m2: null,
  check_in_time: null,
  check_out_time: null,
  stay_types: [],
  extra_guest_fee_weekday: null,
  extra_guest_fee_weekend: null,
  extra_guest_after: null,
  other_rates: [],
  highlights: [],
  amenity_details: {},
  about: null,
};

export type CoreValues = {
  max_guests: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  price_weekday: number | null;
  price_weekend: number | null;
};

export type ConversionResult = {
  details: ListingDetails;
  amenities: string[];
  core: CoreValues;
  warnings: { field: string; message: string }[];
};

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};
const str = (v: unknown, max = 200): string | null => {
  if (typeof v !== "string") return null;
  const s = v.replace(/<[^>]*>/g, "").trim().slice(0, max);
  return s ? s : null;
};

/** Read stored row values into the details model, tolerating nulls and odd JSON. */
export function detailsFromRow(row: Record<string, unknown>): ListingDetails {
  const rates = Array.isArray(row.other_rates) ? row.other_rates : [];
  const ad = row.amenity_details && typeof row.amenity_details === "object" ? (row.amenity_details as Record<string, unknown>) : {};
  return {
    min_guests: num(row.min_guests),
    bedroom_details: str(row.bedroom_details),
    bathroom_details: str(row.bathroom_details),
    kitchens: num(row.kitchens),
    living_area_m2: num(row.living_area_m2),
    check_in_time: str(row.check_in_time, 40),
    check_out_time: str(row.check_out_time, 40),
    stay_types: Array.isArray(row.stay_types) ? (row.stay_types as unknown[]).filter((s): s is string => typeof s === "string" && (STAY_TYPES as readonly string[]).includes(s)) : [],
    extra_guest_fee_weekday: num(row.extra_guest_fee_weekday),
    extra_guest_fee_weekend: num(row.extra_guest_fee_weekend),
    extra_guest_after: num(row.extra_guest_after),
    other_rates: rates
      .map((r) => ({ name: str((r as OtherRate)?.name, 60) ?? "", price: num((r as OtherRate)?.price) ?? 0 }))
      .filter((r) => r.name && r.price > 0),
    highlights: Array.isArray(row.highlights) ? (row.highlights as unknown[]).map((h) => str(h, 80)).filter((h): h is string => !!h).slice(0, 8) : [],
    amenity_details: Object.fromEntries(
      Object.entries(ad).map(([k, v]) => [k, str(v, 120)]).filter((e): e is [string, string] => !!e[1]),
    ),
    about: str(row.about, 1000),
  };
}

export function hasStructuredDetails(d: ListingDetails): boolean {
  return Object.entries(d).filter(([key]) => !["min_guests", "kitchens", "bathroom_details", "living_area_m2"].includes(key)).some(([, v]) =>
    Array.isArray(v) ? v.length > 0 : v && typeof v === "object" ? Object.keys(v).length > 0 : v != null,
  );
}

/** Reasons a listing still needs details. Conflicts are passed in from conversion. */
export function computeMissingReasons(core: CoreValues, d: ListingDetails): string[] {
  const missing: string[] = [];
  if (!core.max_guests) missing.push("guests");
  if (!core.bedrooms) missing.push("bedrooms");
  if (!core.bathrooms) missing.push("bathrooms");
  if (!d.check_in_time) missing.push("check-in time");
  if (!d.check_out_time) missing.push("check-out time");
  if (!core.price_weekday || !core.price_weekend) missing.push("prices");
  return missing.length ? [`Missing: ${missing.join(", ")}`] : [];
}

// ---------------- AI prompt ----------------

export const CONVERT_SYSTEM_PROMPT = `You convert a Lebanese guesthouse owner's description into structured listing fields.
Strict rules:
- Only extract what is actually written. Never invent, assume or guess. If something is not stated, leave it null or empty.
- Remove emojis, sales phrases, hashtags and lines like "Contact Beitak.lb to reserve" or "DM us".
- "about": rewrite as 2-3 clean, natural sentences in English describing the place, based only on the text. Under 600 characters.
- "highlights": up to 6 short facts (max 6 words each), e.g. "1,200 m above sea level", "Sea & mountain views", "5 min from Douma".
- Amenities: map each amenity to the EXACT name from this list when it matches (case and spelling variants count, e.g. WiFi / Wi-Fi / wifi -> "High speed WiFi"; air conditioning -> "AC"; fireplace -> "Chimney"; 24/7 electricity -> "Electricity 24/7"): {{AMENITIES}}.
  Skip anything that does not match the list. Never create custom amenities. Do not list bedrooms, bathrooms or kitchens as amenities or amenity details.
- amenity_details: optional detail line per amenity name, only when written (e.g. Pool: "7m × 3.5m, 1.3m deep").
- Prices in USD as plain numbers. price_weekday/price_weekend are per-night prices. extra_guest_fee_* is per extra person; extra_guest_after is the guest count after which the fee applies.
- other_rates: other named prices such as Monthly, Events, Weddings, Day use.
- stay_types: any of "overnight", "day use", "events" only when stated or clearly offered.
- Times as written, normalized like "2:00 PM".
- Fix obvious typos in what you output, and list each in "typos" as "original -> fixed".
- bedroom_details: a short bedroom breakdown only, e.g. "3 master + 3 double". bedrooms and bathrooms are the counts of bedrooms and full bathrooms as written (a guest toilet is not a bathroom).
- Do not extract minimum guests, kitchens, bathroom detail lines or living area into any field.
- In "unclear", list short notes for anything ambiguous.`;

export function buildSystemPrompt(): string {
  return CONVERT_SYSTEM_PROMPT.replace("{{AMENITIES}}", AMENITY_OPTIONS.map((a) => `"${a}"`).join(", "));
}

const nullable = (type: string) => ({ type: [type, "null"] });

export const CONVERT_TOOL = {
  type: "function",
  function: {
    name: "save_listing_details",
    description: "Save the structured details extracted from the description.",
    parameters: {
      type: "object",
      properties: {
        max_guests: nullable("number"),
        bedrooms: nullable("number"),
        bedroom_details: nullable("string"),
        bathrooms: nullable("number"),
        check_in_time: nullable("string"),
        check_out_time: nullable("string"),
        stay_types: { type: "array", items: { type: "string", enum: [...STAY_TYPES] } },
        price_weekday: nullable("number"),
        price_weekend: nullable("number"),
        extra_guest_fee_weekday: nullable("number"),
        extra_guest_fee_weekend: nullable("number"),
        extra_guest_after: nullable("number"),
        other_rates: {
          type: "array",
          items: { type: "object", properties: { name: { type: "string" }, price: { type: "number" } }, required: ["name", "price"] },
        },
        highlights: { type: "array", items: { type: "string" } },
        amenities: { type: "array", items: { type: "string" } },
        amenity_details: {
          type: "array",
          items: { type: "object", properties: { amenity: { type: "string" }, detail: { type: "string" } }, required: ["amenity", "detail"] },
        },
        about: nullable("string"),
        typos: { type: "array", items: { type: "string" } },
        unclear: { type: "array", items: { type: "string" } },
      },
      required: ["amenities", "highlights", "other_rates", "stay_types", "typos", "unclear"],
    },
  },
} as const;

/** Map an amenity name onto the built-in list when it is a spelling variant. */
export function canonicalAmenity(name: string): string {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const a of AMENITY_OPTIONS) if (a.toLowerCase().replace(/[^a-z0-9]/g, "") === key) return a;
  if (/^(wifi|internet|highspeedinternet|wireless)/.test(key)) return "High speed WiFi";
  if (/^(airconditioning|aircon|ac|centralac)$/.test(key)) return "AC";
  if (/^(fireplace|chimney)$/.test(key)) return "Chimney";
  if (/^(bbq|barbecue|barbeque|bbqarea)$/.test(key)) return "BBQ Area";
  if (/^(jacuzzi|hottub)$/.test(key)) return "Jacuzzi";
  if (/^(swimmingpool|privatepool|pool)$/.test(key)) return "Pool";
  if (/^(freeparking|parking|privateparking)$/.test(key)) return "Parking";
  if (/^(smarttv|tv|netflix)$/.test(key)) return "Smart TV & streaming services";
  return name.trim();
}

/** Turn the AI tool output into safe, normalized values plus warnings. */
export function normalizeConversion(raw: Record<string, unknown>): ConversionResult {
  const amenitySet = new Map<string, string>();
  for (const a of Array.isArray(raw.amenities) ? raw.amenities : []) {
    const s = str(a, 40);
    if (!s) continue;
    const c = canonicalAmenity(s);
    if (!AMENITY_OPTIONS.includes(c)) continue;
    if (!amenitySet.has(c.toLowerCase())) amenitySet.set(c.toLowerCase(), c);
  }
  const amenities = [...amenitySet.values()];
  const amenity_details: Record<string, string> = {};
  for (const item of Array.isArray(raw.amenity_details) ? raw.amenity_details : []) {
    const name = str((item as { amenity?: unknown }).amenity, 40);
    const detail = str((item as { detail?: unknown }).detail, 120);
    if (!name || !detail) continue;
    const c = canonicalAmenity(name);
    const match = amenities.find((a) => a.toLowerCase() === c.toLowerCase());
    if (match) amenity_details[match] = detail;
  }
  const details = detailsFromRow({
    ...raw,
    min_guests: null,
    kitchens: null,
    bathroom_details: null,
    living_area_m2: null,
    amenity_details,
    about: str(raw.about, 1000),
  });
  const core: CoreValues = {
    max_guests: num(raw.max_guests),
    bedrooms: num(raw.bedrooms),
    bathrooms: num(raw.bathrooms),
    price_weekday: num(raw.price_weekday),
    price_weekend: num(raw.price_weekend),
  };
  const warnings: { field: string; message: string }[] = [];
  const miss = (field: keyof ListingDetails | keyof CoreValues, label: string, v: unknown) => {
    if (v == null) warnings.push({ field, message: `${label} not in the text` });
  };
  miss("max_guests", "Max guests", core.max_guests);
  miss("bedrooms", "Bedrooms", core.bedrooms);
  miss("bathrooms", "Bathrooms", core.bathrooms);
  miss("price_weekday", "Weekday price", core.price_weekday);
  miss("price_weekend", "Weekend price", core.price_weekend);
  miss("check_in_time", "Check-in time", details.check_in_time);
  miss("check_out_time", "Check-out time", details.check_out_time);
  for (const t of Array.isArray(raw.typos) ? raw.typos : []) {
    const s = str(t, 120);
    if (s) warnings.push({ field: "typo", message: `Possible typo: ${s}` });
  }
  for (const u of Array.isArray(raw.unclear) ? raw.unclear : []) {
    const s = str(u, 160);
    if (s) warnings.push({ field: "unclear", message: s });
  }
  return { details, amenities, core, warnings };
}

/** Compare AI-read core values with stored ones; returns conflict labels. */
export function findConflicts(stored: CoreValues, read: CoreValues): string[] {
  const labels: Record<keyof CoreValues, string> = {
    max_guests: "guests",
    bedrooms: "bedrooms",
    bathrooms: "bathrooms",
    price_weekday: "weekday",
    price_weekend: "weekend",
  };
  const out: string[] = [];
  for (const k of Object.keys(labels) as (keyof CoreValues)[]) {
    const a = stored[k];
    const b = read[k];
    if (a != null && b != null && Number(a) !== Number(b)) out.push(labels[k]);
  }
  return out;
}

// ---------------- AI call (Lovable AI Gateway, Responses API, streamed) ----------------

function strict(schema: Record<string, unknown>): Record<string, unknown> {
  if (schema.type === "object" && schema.properties) {
    const props = schema.properties as Record<string, Record<string, unknown>>;
    return {
      ...schema,
      properties: Object.fromEntries(Object.entries(props).map(([k, v]) => [k, strict(v)])),
      required: Object.keys(props),
      additionalProperties: false,
    };
  }
  if (schema.type === "array" && schema.items) return { ...schema, items: strict(schema.items as Record<string, unknown>) };
  return schema;
}

export const CONVERT_MODEL = "openai/gpt-6-astra";

/** Calls the gateway and returns normalized fields. Throws Error with a friendly message. */
export async function convertDescription(text: string, apiKey: string): Promise<ConversionResult> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Lovable-API-Key": apiKey, Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: CONVERT_MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions: buildSystemPrompt(),
      input: [{ role: "user", content: text }],
      text: {
        format: {
          type: "json_schema",
          name: "listing_details",
          strict: true,
          schema: strict(CONVERT_TOOL.function.parameters as unknown as Record<string, unknown>),
        },
      },
    }),
  });
  if (res.status === 429) throw new Error("AI is busy, try again in a moment.");
  if (res.status === 402) throw new Error("AI credits have run out for this workspace.");
  if (!res.ok || !res.body) throw new Error(`Conversion failed (${res.status}). Try again.`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload) as { type?: string; delta?: string };
        if (ev.type === "response.output_text.delta" && ev.delta) out += ev.delta;
      } catch {
        /* ignore */
      }
    }
  }
  try {
    return normalizeConversion(JSON.parse(out));
  } catch {
    throw new Error("Conversion failed. Try again.");
  }
}
