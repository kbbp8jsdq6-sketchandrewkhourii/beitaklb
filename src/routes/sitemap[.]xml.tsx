import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://beitaklb.com";

const STATIC_URLS: { loc: string; changefreq: string; priority: string }[] = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/search", changefreq: "daily", priority: "0.9" },
  { loc: "/about", changefreq: "monthly", priority: "0.6" },
  { loc: "/contact", changefreq: "monthly", priority: "0.6" },
  { loc: "/become-a-host", changefreq: "monthly", priority: "0.6" },
  { loc: "/feedback", changefreq: "monthly", priority: "0.4" },
  { loc: "/terms", changefreq: "yearly", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        let listingUrls = "";
        try {
          const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
          const key =
            process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
            process.env.SUPABASE_PUBLISHABLE_KEY ||
            process.env.SUPABASE_ANON_KEY;
          if (url && key) {
            const supabase = createClient(url, key);
            const { data } = await supabase
              .from("listings")
              .select("id, updated_at")
              .eq("is_active", true)
              .order("updated_at", { ascending: false })
              .limit(1000);
            listingUrls = (data ?? [])
              .map(
                (l: { id: string; updated_at: string }) =>
                  `  <url>\n    <loc>${SITE_URL}/listing/${l.id}</loc>\n    <lastmod>${new Date(l.updated_at).toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
              )
              .join("\n");
          }
        } catch {
          // Ignore — return at least the static URLs.
        }

        const staticXml = STATIC_URLS.map(
          (u) =>
            `  <url>\n    <loc>${SITE_URL}${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
        ).join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticXml}${listingUrls ? "\n" + listingUrls : ""}\n</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});
