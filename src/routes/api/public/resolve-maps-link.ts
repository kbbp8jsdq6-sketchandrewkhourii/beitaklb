import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

function extractCoords(text: string): { lat: number; lng: number } | null {
  // 1) @lat,lng,zoom
  const at = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: Number(at[1]), lng: Number(at[2]) };

  // 2) q=lat,lng / ll=lat,lng (also URL-encoded comma)
  const q =
    text.match(/[?&](?:q|ll|query|center)=(-?\d+\.\d+)%2C(-?\d+\.\d+)/i) ??
    text.match(/[?&](?:q|ll|query|center)=(-?\d+\.\d+),(-?\d+\.\d+)/i);
  if (q) return { lat: Number(q[1]), lng: Number(q[2]) };

  // 3) !3dlat!4dlng
  const d = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (d) return { lat: Number(d[1]), lng: Number(d[2]) };

  return null;
}

export const Route = createFileRoute("/api/public/resolve-maps-link")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const raw = (body as { url?: unknown } | null)?.url;
        if (typeof raw !== "string" || raw.trim().length === 0) {
          return json({ error: "A map link is required." }, 400);
        }

        let parsed: URL;
        try {
          parsed = new URL(raw.trim());
        } catch {
          return json({ error: "That doesn't look like a valid link." }, 400);
        }
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return json({ error: "That doesn't look like a valid link." }, 400);
        }

        // Coordinates may already be present in the pasted link.
        const direct = extractCoords(parsed.toString());
        if (direct) return json(direct);

        try {
          const res = await fetch(parsed.toString(), {
            redirect: "follow",
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            },
          });
          let coords = extractCoords(res.url || parsed.toString());
          if (!coords) {
            const html = await res.text();
            coords = extractCoords(html.slice(0, 200_000));
          }
          if (coords) return json(coords);
        } catch (err) {
          console.error("resolve-maps-link fetch failed:", err);
        }

        return json(
          {
            error:
              "Couldn't find a location in that link - try copying the link again from the Google Maps app share button",
          },
          422,
        );
      },
    },
  },
});
