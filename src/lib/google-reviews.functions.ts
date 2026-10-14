import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const getGoogleReviews = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("Review service is unavailable");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const [reviews, settings] = await Promise.all([
    client.from("google_reviews").select("id, guest_name, rating, review_text, property_name, featured, display_order").order("display_order").order("created_at"),
    client.from("site_settings").select("google_rating, google_review_count, google_reviews_page_link").eq("id", 1).maybeSingle(),
  ]);
  if (reviews.error) throw reviews.error;
  if (settings.error) throw settings.error;
  return { reviews: reviews.data ?? [], rating: settings.data?.google_rating ?? null, count: settings.data?.google_review_count ?? null, reviewsPageLink: settings.data?.google_reviews_page_link?.trim() || null };
});