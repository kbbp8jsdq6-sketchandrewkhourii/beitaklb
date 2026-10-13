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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HOST_TYPES = ["villa", "mansion", "cabin", "apartment", "hotel"];

export const Route = createFileRoute("/api/public/chat-event")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        let body: any;
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
        const { conversationId, visitorId, type } = body ?? {};
        if (typeof conversationId !== "string" || !UUID_RE.test(conversationId)) return json({ error: "Invalid conversationId" }, 400);
        if (typeof visitorId !== "string" || visitorId.length < 8 || visitorId.length > 100) return json({ error: "Invalid visitorId" }, 400);
        if (type !== "handoff" && type !== "host_form") return json({ error: "Invalid type" }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as any;

        const { data: conv } = await db.from("chat_conversations").select("id, visitor_id").eq("id", conversationId).maybeSingle();
        if (!conv || conv.visitor_id !== visitorId) return json({ error: "Not found" }, 404);

        if (type === "handoff") {
          const listingId = body.listingId;
          if (typeof listingId !== "string" || !UUID_RE.test(listingId)) return json({ error: "Invalid listingId" }, 400);
          const guests = typeof body.guests === "number" && Number.isInteger(body.guests) && body.guests > 0 ? Math.min(body.guests, 20) : 1;
          const checkIn = typeof body.checkIn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.checkIn) ? body.checkIn : null;
          await db.from("chat_conversations").update({ handoff_clicked: true, handoff_listing_id: listingId }).eq("id", conversationId);
          await db.from("chat_messages").insert({ conversation_id: conversationId, role: "event", content: "Opened WhatsApp for booking" });
          const { error } = await db.from("reservation_clicks").insert({ listing_id: listingId, guests, requested_date: checkIn });
          if (error) console.error("reservation_clicks insert", error);
        } else {
          const f = body.form ?? {};
          const fullName = typeof f.fullName === "string" ? f.fullName.trim() : "";
          const ftype = typeof f.type === "string" ? f.type.trim().toLowerCase() : "";
          const location = typeof f.location === "string" ? f.location.trim() : "";
          const maxGuests = f.maxGuests;
          if (fullName.length < 2 || fullName.length > 100) return json({ error: "Invalid full name" }, 400);
          if (!HOST_TYPES.includes(ftype)) return json({ error: "Invalid type" }, 400);
          if (location.length < 2 || location.length > 150) return json({ error: "Invalid location" }, 400);
          if (typeof maxGuests !== "number" || !Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 500)
            return json({ error: "Invalid max guests" }, 400);
          const form = { fullName, type: ftype, location, maxGuests };
          await db.from("chat_conversations").update({ host_form: form }).eq("id", conversationId);
          await db.from("chat_messages").insert({
            conversation_id: conversationId, role: "event",
            content: `Submitted host form: ${fullName}, ${ftype}, ${location}, ${maxGuests} guests`,
          });
        }

        await db.from("chat_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
        return json({ ok: true });
      },
    },
  },
});
