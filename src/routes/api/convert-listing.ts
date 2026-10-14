import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { convertDescription } from "@/lib/listing-details";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// Admin-only: converts a pasted owner description into structured listing fields with Lovable AI.
export const Route = createFileRoute("/api/convert-listing")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return json({ error: "Please sign in again." }, 401);
        const url = process.env["SUPABASE_URL"]!;
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
        const sb = createClient<Database>(url, key, {
          auth: { persistSession: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: userData, error: uErr } = await sb.auth.getUser(token);
        if (uErr || !userData.user) return json({ error: "Please sign in again." }, 401);
        const { data: isAdmin } = await sb.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
        if (!isAdmin) return json({ error: "Admins only." }, 403);

        let text = "";
        try {
          const body = (await request.json()) as { text?: unknown };
          text = typeof body.text === "string" ? body.text.slice(0, 6000).trim() : "";
        } catch {
          /* empty */
        }
        if (text.length < 10) return json({ error: "Paste a description first." }, 400);

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return json({ error: "AI is not available right now." }, 500);
        try {
          return json(await convertDescription(text, apiKey));
        } catch (e) {
          return json({ error: e instanceof Error ? e.message : "Conversion failed." }, 502);
        }
      },
    },
  },
});
