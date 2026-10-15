import { createFileRoute } from "@tanstack/react-router";
import { buildListingMessage, buildWhatsAppHref } from "@/lib/whatsapp";

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
const DISTRICTS = ["Aley", "Baabda", "Batroun", "Byblos", "Chouf", "Keserwan", "Maten", "North Lebanon"];

const TOOLS = [
  {
    name: "search_listings",
    description: "Search active Beitak listings. Returns up to 3 best matches.",
    input_schema: {
      type: "object",
      properties: {
        district: { type: "string", enum: DISTRICTS },
        location_text: { type: "string", description: "Town or area name" },
        guests: { type: "integer" },
        bedrooms_min: { type: "integer" },
        max_price_per_night: { type: "number", description: "USD" },
        category: { type: "string", enum: ["villa", "cabin", "apartment"] },
        must_have: {
          type: "array",
          items: { type: "string" },
          description: 'Amenity keywords like "pool","breakfast","jacuzzi","pet"',
        },
        couples: { type: "boolean" },
      },
    },
  },
  {
    name: "get_listing_details",
    description: "Get full details and description of one listing.",
    input_schema: {
      type: "object",
      properties: { listing_id: { type: "string", description: "uuid" } },
      required: ["listing_id"],
    },
  },
  {
    name: "show_booking_handoff",
    description: 'Show the guest a "Continue on WhatsApp" button for a specific listing.',
    input_schema: {
      type: "object",
      properties: {
        listing_id: { type: "string" },
        check_in: { type: "string", description: "YYYY-MM-DD" },
        check_out: { type: "string", description: "YYYY-MM-DD" },
        guests: { type: "integer" },
      },
      required: ["listing_id"],
    },
  },
  {
    name: "show_host_form",
    description: "Show the property owner application form.",
    input_schema: { type: "object", properties: {} },
  },
];

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
function fmtDate(d: string) {
  const t = new Date(`${d}T00:00:00Z`);
  return Number.isNaN(t.getTime()) ? d : dateFmt.format(t);
}

type Card = {
  id: string; title: string; location: string; category: string; bedrooms: number | null;
  max_guests: number | null; price_weekday: number | null; price_weekend: number | null;
  price_per_night: number | null; cover: string | null; url: string;
};
type Handoff = { listingId: string; title: string; href: string; guests: number | null; checkIn: string | null };

export const Route = createFileRoute("/api/public/chat")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        let body: any;
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
        const visitorId = body?.visitorId;
        const message = typeof body?.message === "string" ? body.message.trim() : "";
        const conversationIdIn = body?.conversationId;
        if (typeof visitorId !== "string" || visitorId.length < 8 || visitorId.length > 100)
          return json({ error: "Invalid visitorId" }, 400);
        if (message.length < 1 || message.length > 800) return json({ error: "Message must be 1 to 800 characters" }, 400);
        if (conversationIdIn != null && (typeof conversationIdIn !== "string" || !UUID_RE.test(conversationIdIn)))
          return json({ error: "Invalid conversationId" }, 400);
        const pageUrl = typeof body?.pageUrl === "string" ? body.pageUrl.slice(0, 500) : null;

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return json({ error: "The assistant is unavailable right now. Please message us on WhatsApp." }, 503);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as any;

        const ip = request.headers.get("cf-connecting-ip")
          ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
          ?? "unknown";
        const ipHash = await sha256Hex(`beitak-chat:${ip}`);

        let conv: any = null;
        if (conversationIdIn) {
          const { data } = await db.from("chat_conversations").select("*").eq("id", conversationIdIn).maybeSingle();
          if (data && data.visitor_id === visitorId) conv = data;
        }
        if (!conv) {
          const { data, error } = await db.from("chat_conversations").insert({
            visitor_id: visitorId, ip_hash: ipHash, page_url: pageUrl,
            user_agent: (request.headers.get("user-agent") ?? "").slice(0, 300),
          }).select("*").single();
          if (error || !data) { console.error("chat create conv", error); return json({ error: "Could not start chat" }, 500); }
          conv = data;
        }
        const conversationId: string = conv.id;

        if ((conv.message_count ?? 0) >= 80)
          return json({ error: "This chat has reached its limit. Please continue on WhatsApp." }, 429);

        const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: recentConvs } = await db.from("chat_conversations").select("id").eq("ip_hash", ipHash).gte("last_message_at", since);
        const ids = (recentConvs ?? []).map((c: any) => c.id);
        if (ids.length) {
          const { count } = await db.from("chat_messages").select("id", { count: "exact", head: true })
            .in("conversation_id", ids).eq("role", "user").gte("created_at", since);
          if ((count ?? 0) >= 40)
            return json({ error: "You're sending messages too quickly. Please try again in a bit or message us on WhatsApp." }, 429);
        }

        await db.from("chat_messages").insert({ conversation_id: conversationId, role: "user", content: message });

        const { data: hist } = await db.from("chat_messages").select("role, content, created_at")
          .eq("conversation_id", conversationId).in("role", ["user", "assistant"])
          .order("created_at", { ascending: false }).limit(20);
        const rows = ((hist ?? []) as any[]).reverse();
        while (rows.length && rows[0].role !== "user") rows.shift();
        const messages: any[] = [];
        for (const r of rows) {
          const last = messages[messages.length - 1];
          if (last && last.role === r.role) last.content += "\n" + r.content;
          else messages.push({ role: r.role, content: r.content });
        }

        let cards: Card[] = [];
        let handoff: Handoff | null = null;
        let showHostForm = false;

        const runTool = async (name: string, input: any): Promise<unknown> => {
          if (name === "search_listings") {
            let q = db.from("listings").select(
              "id, title, location, district, category, max_guests, bedrooms, bathrooms, price_per_night, price_weekday, price_weekend, amenities, is_couples, listing_photos(photo_url, display_order)",
            ).eq("is_active", true).eq("status", "approved");
            if (input.district) q = q.eq("district", input.district);
            if (input.category) q = q.eq("category", input.category);
            if (typeof input.bedrooms_min === "number") q = q.gte("bedrooms", input.bedrooms_min);
            if (input.couples === true) q = q.eq("is_couples", true);
            if (typeof input.location_text === "string") {
              const t = input.location_text.replace(/[^\p{L}\p{N} \-\u0600-\u06FF]/gu, "").trim();
              if (t) q = q.or(`location.ilike.%${t}%,title.ilike.%${t}%`);
            }
            const { data, error } = await q.limit(200);
            if (error) { console.error("search_listings", error); return { results: [], note: "No matches" }; }
            let list = (data ?? []) as any[];
            const guests = typeof input.guests === "number" ? input.guests : null;
            if (guests != null) list = list.filter((l) => l.max_guests != null && l.max_guests >= guests);
            const nightly = (l: any) => Math.min(l.price_weekday ?? l.price_per_night ?? Infinity, l.price_weekend ?? l.price_per_night ?? Infinity);
            if (typeof input.max_price_per_night === "number") list = list.filter((l) => nightly(l) <= input.max_price_per_night);
            if (Array.isArray(input.must_have) && input.must_have.length) {
              const kws = input.must_have.map((k: unknown) => String(k).toLowerCase().trim()).filter(Boolean);
              list = list.filter((l) => {
                const am = ((l.amenities ?? []) as string[]).map((a) => a.toLowerCase());
                return kws.every((k: string) => am.some((a) => a.includes(k) || (k.startsWith("pet") && a.includes("pet"))));
              });
            }
            list.sort((a, b) => guests != null ? a.max_guests - b.max_guests : nightly(a) - nightly(b));
            const top = list.slice(0, 3);
            cards = top.map((l) => {
              const photos = ((l.listing_photos ?? []) as any[]).slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
              return {
                id: l.id, title: l.title, location: l.location, category: l.category, bedrooms: l.bedrooms,
                max_guests: l.max_guests, price_weekday: l.price_weekday, price_weekend: l.price_weekend,
                price_per_night: l.price_per_night, cover: photos[0]?.photo_url ?? null, url: LISTING_BASE_URL + l.id,
              };
            });
            if (!top.length) return { results: [], note: "No matches" };
            return top.map((l) => ({
              id: l.id, title: l.title, location: l.location, district: l.district, category: l.category,
              max_guests: l.max_guests, bedrooms: l.bedrooms, price_weekday: l.price_weekday,
              price_weekend: l.price_weekend, amenities: (l.amenities ?? []).slice(0, 12),
            }));
          }
          if (name === "get_listing_details") {
            if (typeof input.listing_id !== "string" || !UUID_RE.test(input.listing_id)) return { error: "Not found" };
            const { data } = await db.from("listings").select(
              "id, title, location, district, category, max_guests, bedrooms, bathrooms, price_weekday, price_weekend, amenities, description",
            ).eq("id", input.listing_id).eq("is_active", true).eq("status", "approved").maybeSingle();
            if (!data) return { error: "Not found" };
            return { ...data, description: (data.description ?? "").slice(0, 2500) };
          }
          if (name === "show_booking_handoff") {
            if (typeof input.listing_id !== "string" || !UUID_RE.test(input.listing_id)) return { error: "Not found" };
            const { data: l } = await db.from("listings").select("id, title")
              .eq("id", input.listing_id).eq("is_active", true).eq("status", "approved").maybeSingle();
            if (!l) return { error: "Not found" };
            handoff = {
              listingId: l.id, title: l.title,
              href: buildWhatsAppHref(buildListingMessage({
                title: l.title,
                url: LISTING_BASE_URL + l.id,
                ...(input.check_in ? { preferredDate: input.check_in } : {}),
                ...(typeof input.guests === "number" ? { guests: input.guests } : {}),
              })),
              guests: typeof input.guests === "number" ? input.guests : null, checkIn: input.check_in ?? null,
            };
            return { ok: true };
          }
          if (name === "show_host_form") { showHostForm = true; return { ok: true }; }
          return { error: "Unknown tool" };
        };

        const now = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Beirut", weekday: "long", month: "long", day: "numeric", year: "numeric",
          hour: "numeric", minute: "2-digit",
        }).format(new Date());
        let system = buildSystemPrompt(now);
        if (typeof body?.contextListingId === "string" && UUID_RE.test(body.contextListingId)) {
          const { data: contextListing } = await db.from("listings").select("id, title")
            .eq("id", body.contextListingId).eq("is_active", true).eq("status", "approved").maybeSingle();
          if (contextListing) system += `\n\nCURRENT PAGE CONTEXT\nThe guest is currently viewing the listing "${contextListing.title}" (id ${contextListing.id}). When they say "this place", "here", "it", or ask about house rules, check-in, amenities, capacity or price without naming another listing, they mean this one: call get_listing_details with this id before answering. If they want to book it, confirm dates and guests, then call show_booking_handoff with this id.`;
        }

        let runId: string | undefined;
        let busy = false;
        // Lovable AI gateway, native Messages endpoint (required for Claude models), streamed and accumulated server-side.
        const callApi = async () => {
          const headers: Record<string, string> = {
            Authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
            "X-Lovable-AIG-SDK": "fetch",
          };
          if (runId) headers["X-Lovable-AIG-Run-ID"] = runId;
          const res = await fetch("https://ai.gateway.lovable.dev/v1/messages", {
            method: "POST",
            headers,
            body: JSON.stringify({ model: CHAT_MODEL, max_tokens: 700, system, tools: TOOLS, messages, stream: true }),
          });
          runId ??= res.headers.get("X-Lovable-AIG-Run-ID")?.trim() || undefined;
          if (!res.ok || !res.body) {
            console.error("Lovable AI error", res.status, await res.text());
            if (res.status === 429 || res.status === 402) busy = true;
            return null;
          }
          const msg: any = { content: [] as any[], stop_reason: null };
          const partial: Record<number, string> = {};
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let buf = "";
          const handle = (ev: any) => {
            if (ev.type === "content_block_start") {
              const b = { ...ev.content_block };
              if (b.type === "tool_use") { b.input = {}; partial[ev.index] = ""; }
              if (b.type === "text") b.text = b.text ?? "";
              msg.content[ev.index] = b;
            } else if (ev.type === "content_block_delta") {
              const b = msg.content[ev.index];
              if (!b) return;
              if (ev.delta?.type === "text_delta") b.text += ev.delta.text;
              else if (ev.delta?.type === "input_json_delta") partial[ev.index] += ev.delta.partial_json ?? "";
            } else if (ev.type === "content_block_stop") {
              const b = msg.content[ev.index];
              if (b?.type === "tool_use") {
                const raw = partial[ev.index] ?? "";
                try { b.input = raw ? JSON.parse(raw) : {}; } catch { b.input = {}; b._invalid = true; }
              }
            } else if (ev.type === "message_delta") {
              if (ev.delta?.stop_reason) msg.stop_reason = ev.delta.stop_reason;
            } else if (ev.type === "error") {
              throw new Error(`stream error: ${JSON.stringify(ev.error)}`);
            }
          };
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            let i: number;
            while ((i = buf.indexOf("\n\n")) !== -1) {
              const frame = buf.slice(0, i);
              buf = buf.slice(i + 2);
              const data = frame.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
              if (!data || data === "[DONE]") continue;
              try { handle(JSON.parse(data)); } catch (e) { if (String(e).includes("stream error")) throw e; }
            }
          }
          msg.content = (msg.content as any[]).filter(Boolean);
          return msg;
        };
        const fail = () => busy
          ? json({ error: "The assistant is busy right now. Please message us on WhatsApp.", conversationId }, 503)
          : json({ error: "The assistant is having trouble right now. Please try again or message us on WhatsApp.", conversationId }, 502);

        let resp: any;
        try {
          resp = await callApi();
          if (!resp) return fail();
          if (resp.stop_reason === "refusal") return fail();
          let iter = 0;
          while (resp.stop_reason === "tool_use" && iter < 4) {
            iter++;
            const results: any[] = [];
            for (const block of resp.content ?? []) {
              if (block.type !== "tool_use") continue;
              let out: unknown;
              if (block._invalid) out = { error: "Invalid arguments" };
              else {
                try { out = await runTool(block.name, block.input ?? {}); } catch (e) { console.error("tool", block.name, e); out = { error: "Tool failed" }; }
              }
              delete block._invalid;
              results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(out) });
            }
            messages.push({ role: "assistant", content: resp.content });
            messages.push({ role: "user", content: results });
            resp = await callApi();
            if (!resp) return fail();
            if (resp.stop_reason === "refusal") return fail();
          }
        } catch (e) {
          console.error("chat failed", e);
          return fail();
        }

        const reply = ((resp.content ?? []) as any[]).filter((b) => b.type === "text").map((b) => b.text).join("").trim()
          || "Sorry, I didn't catch that. Could you rephrase?";

        await db.from("chat_messages").insert({
          conversation_id: conversationId, role: "assistant", content: reply,
          listing_ids: cards.length ? cards.map((c) => c.id) : null,
        });
        await db.from("chat_conversations").update({
          message_count: (conv.message_count ?? 0) + 2, last_message_at: new Date().toISOString(),
        }).eq("id", conversationId);

        return json({ conversationId, reply, listings: cards, handoff, showHostForm });
      },
    },
  },
});
