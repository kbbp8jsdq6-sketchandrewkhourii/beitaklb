import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/chats")({
  head: () => ({
    meta: [
      { title: "Chats - Admin - BEITAK" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminChatsPage,
});

type HostForm = { fullName?: string; type?: string; location?: string; maxGuests?: number } | null;
type Conversation = {
  id: string;
  visitor_id: string;
  page_url: string | null;
  user_agent: string | null;
  message_count: number;
  handoff_clicked: boolean;
  handoff_listing_id: string | null;
  host_form: HostForm;
  created_at: string;
  last_message_at: string;
};
type Message = {
  id: string;
  role: "user" | "assistant" | "event";
  content: string;
  listing_ids: string[] | null;
  created_at: string;
};
type Filter = "all" | "handoff" | "host";

const PAGE = 50;
const db = supabase as any;

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
  return new Date(iso).toLocaleDateString();
}

function AdminChatsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const convQ = useInfiniteQuery({
    queryKey: ["admin-chat-conversations"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = pageParam as number;
      const { data, error } = await db
        .from("chat_conversations")
        .select("*")
        .order("last_message_at", { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      return (data ?? []) as Conversation[];
    },
    getNextPageParam: (last, all) =>
      last.length === PAGE ? all.length * PAGE : undefined,
  });

  const conversations = useMemo(() => convQ.data?.pages.flat() ?? [], [convQ.data]);
  const ids = useMemo(() => conversations.map((c) => c.id), [conversations]);

  const previewsQ = useQuery({
    queryKey: ["admin-chat-previews", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await db
        .from("chat_messages")
        .select("conversation_id, content, created_at")
        .eq("role", "user")
        .in("conversation_id", ids)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const m of (data ?? []) as { conversation_id: string; content: string }[]) {
        if (!(m.conversation_id in map)) map[m.conversation_id] = m.content;
      }
      return map;
    },
  });
  const previews = previewsQ.data ?? {};

  const statsQ = useQuery({
    queryKey: ["admin-chat-stats"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
      const { data, error } = await db
        .from("chat_conversations")
        .select("id, handoff_clicked, host_form, created_at")
        .gte("created_at", since);
      if (error) throw error;
      const rows = (data ?? []) as Pick<Conversation, "handoff_clicked" | "host_form">[];
      return {
        chats: rows.length,
        handoffs: rows.filter((r) => r.handoff_clicked).length,
        hosts: rows.filter((r) => r.host_form).length,
      };
    },
  });

  const counts = {
    all: conversations.length,
    handoff: conversations.filter((c) => c.handoff_clicked).length,
    host: conversations.filter((c) => c.host_form).length,
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter === "handoff" && !c.handoff_clicked) return false;
      if (filter === "host" && !c.host_form) return false;
      if (s && !(previews[c.id] ?? "").toLowerCase().includes(s)) return false;
      return true;
    });
  }, [conversations, filter, search, previews]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const onDeleted = () => {
    setSelectedId(null);
    convQ.refetch();
    statsQ.refetch();
  };

  const filterLabels: Record<Filter, string> = {
    all: "All",
    handoff: "WhatsApp handoff",
    host: "Host applications",
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-foreground">Chats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversations with the website assistant.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Chats (30 days)", value: statsQ.data?.chats },
          { label: "WhatsApp handoffs (30 days)", value: statsQ.data?.handoffs },
          { label: "Host applications (30 days)", value: statsQ.data?.hosts },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-display text-3xl text-foreground">{s.value ?? "-"}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className={selected ? "hidden lg:block" : ""}>
          <div className="mb-3 flex flex-wrap gap-2">
            {(["all", "handoff", "host"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {filterLabels[f]} ({counts[f]})
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search first message…"
            className="mb-3 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />

          {convQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

          <div className="space-y-2">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full rounded-2xl border bg-card p-4 text-left transition ${
                  c.id === selectedId ? "border-primary/50 bg-primary/5" : "border-border"
                }`}
              >
                <p className="line-clamp-2 text-sm font-medium text-foreground">
                  {previews[c.id] ?? "(no messages)"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {relTime(c.last_message_at)} · {c.message_count} messages
                </p>
                {(c.handoff_clicked || c.host_form) && (
                  <div className="mt-2 flex gap-1.5">
                    {c.handoff_clicked && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-800">
                        WhatsApp
                      </span>
                    )}
                    {c.host_form && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        Host form
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
            {!convQ.isLoading && filtered.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                No chats found.
              </p>
            )}
          </div>

          {convQ.hasNextPage && (
            <Button
              variant="outline"
              className="mt-3 w-full"
              disabled={convQ.isFetchingNextPage}
              onClick={() => convQ.fetchNextPage()}
            >
              {convQ.isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          )}
        </div>

        <div className={selected ? "" : "hidden lg:block"}>
          <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            {selected ? (
              <Transcript
                key={selected.id}
                conv={selected}
                onBack={() => setSelectedId(null)}
                onDeleted={onDeleted}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Select a chat to read it.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Transcript({
  conv,
  onBack,
  onDeleted,
}: {
  conv: Conversation;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const msgQ = useQuery({
    queryKey: ["admin-chat-messages", conv.id],
    queryFn: async () => {
      const { data, error } = await db
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });
  const messages = msgQ.data ?? [];

  const listingIds = useMemo(() => {
    const set = new Set<string>();
    if (conv.handoff_listing_id) set.add(conv.handoff_listing_id);
    for (const m of messages) for (const id of m.listing_ids ?? []) set.add(id);
    return [...set];
  }, [messages, conv.handoff_listing_id]);

  const titlesQ = useQuery({
    queryKey: ["admin-chat-listing-titles", listingIds],
    enabled: listingIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title")
        .in("id", listingIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const l of data ?? []) map[l.id] = l.title;
      return map;
    },
  });
  const titles = titlesQ.data ?? {};

  const remove = async () => {
    if (!confirm("Delete this conversation permanently?")) return;
    const { error } = await db.from("chat_conversations").delete().eq("id", conv.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Conversation deleted");
      onDeleted();
    }
  };

  const device = /Mobi|Android|iPhone/i.test(conv.user_agent ?? "") ? "Mobile" : "Desktop";
  const hf = conv.host_form;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <Button variant="ghost" size="sm" className="mb-3 lg:hidden" onClick={onBack}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to chats
      </Button>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Started {new Date(conv.created_at).toLocaleString()}</span>
        {conv.page_url && (
          <a
            href={conv.page_url}
            target="_blank"
            rel="noreferrer"
            className="max-w-[240px] truncate underline hover:text-foreground"
          >
            {conv.page_url}
          </a>
        )}
        <span>{device}</span>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-destructive"
          onClick={remove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {hf && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="mb-2 font-semibold text-foreground">Host application</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-muted-foreground">Full name</dt>
            <dd>{hf.fullName}</dd>
            <dt className="text-muted-foreground">Type</dt>
            <dd>{hf.type ? hf.type.charAt(0).toUpperCase() + hf.type.slice(1) : ""}</dd>
            <dt className="text-muted-foreground">Location</dt>
            <dd>{hf.location}</dd>
            <dt className="text-muted-foreground">Max guests</dt>
            <dd>{hf.maxGuests}</dd>
          </dl>
        </div>
      )}

      {conv.handoff_listing_id && (
        <p className="mt-4 text-sm text-foreground">
          Opened WhatsApp for:{" "}
          <Link
            to="/listing/$id"
            params={{ id: conv.handoff_listing_id }}
            className="font-semibold text-primary underline"
          >
            {titles[conv.handoff_listing_id] ?? "listing"}
          </Link>
        </p>
      )}

      <div className="mt-5 space-y-4">
        {msgQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {messages.map((m) => {
          const time = new Date(m.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          if (m.role === "event") {
            return (
              <div key={m.id} className="text-center">
                <p className="text-xs text-muted-foreground">{m.content}</p>
                <p className="text-[10px] text-muted-foreground">{time}</p>
              </div>
            );
          }
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
                  isUser
                    ? "rounded-br-md bg-foreground text-white"
                    : "rounded-bl-md bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
              {!isUser && m.listing_ids && m.listing_ids.length > 0 && (
                <div className="mt-1.5 flex max-w-[80%] flex-wrap gap-1.5">
                  {m.listing_ids.map((id) => (
                    <Link
                      key={id}
                      to="/listing/$id"
                      params={{ id }}
                      className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted"
                    >
                      {titles[id] ?? "Listing"}
                    </Link>
                  ))}
                </div>
              )}
              <p className="mt-1 text-[10px] text-muted-foreground">{time}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
