import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { matchesHolidayLocation } from "./holiday-collection";

export interface HolidayListing {
  id: string;
  title: string;
  location: string;
  max_guests: number | null;
  bedrooms: number | null;
  price: number | null;
  cover: string | null;
}

export const getHolidayCollection = createServerFn({ method: "GET" }).handler(async (): Promise<HolidayListing[]> => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) return [];
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data: settings } = await client.from("site_settings").select("holiday_collection_enabled, holiday_collection_selected").eq("id", 1).maybeSingle();
  if (settings && !settings.holiday_collection_enabled) return [];
  const places = settings?.holiday_collection_selected ?? [];
  if (!places.length) return [];
  const { data, error } = await client
    .from("listings")
    .select("id, title, location, bedrooms, max_guests, price_weekday, listing_photos(photo_url, display_order)")
    .eq("is_active", true);
  if (error) { console.error("Holiday collection read failed"); return []; }
  return (data ?? [])
    .filter((l) => matchesHolidayLocation(l.location, places))
    .map((l) => {
      const photos = (l.listing_photos ?? []).slice().sort((a, b) => a.display_order - b.display_order);
      const price = Number(l.price_weekday);
      return {
        id: l.id,
        title: l.title,
        location: l.location,
        max_guests: l.max_guests && l.max_guests > 0 ? l.max_guests : null,
        bedrooms: l.bedrooms && l.bedrooms > 0 ? l.bedrooms : null,
        price: Number.isFinite(price) && price > 0 ? price : null,
        cover: photos[0]?.photo_url ?? null,
      };
    })
    .sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
});
