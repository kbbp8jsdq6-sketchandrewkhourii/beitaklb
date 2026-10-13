import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppLogo } from "@/components/icons/WhatsAppLogo";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buildWhatsAppHref } from "@/lib/whatsapp";

// The existing JSON transport and single allowed UI file require local UI primitives,
// rather than AI Elements' UIMessage transport and additional registry source files.
type Card = { id: string; title: string; location: string; category: "villa" | "cabin" | "apartment" | null; bedrooms: number | null; max_guests: number | null; price_weekday: number | null; price_weekend: number | null; price_per_night: number | null; cover: string | null; url: string };
type Handoff = { listingId: string; title: string; href: string; guests: number | null; checkIn: string | null };
type UIMessage = { id: string; role: "user" | "assistant" | "error"; text: string; listings?: Card[]; handoff?: Handoff | null; showHostForm?: boolean; hostFormDone?: boolean };
const greeting = "Hi! I can find you a place to stay in Lebanon, answer questions about booking, or help you list your property. Ahla w sahla 👋";
const whatsapp = "https://wa.me/96181160435";
const fallbackError = "Something went wrong. Please try again or message us on WhatsApp.";
const bubble = "max-w-[85%] rounded-[14px] rounded-bl-[4px] px-[13px] py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words";
const fieldClass = "h-10 w-full rounded-lg border border-[#E2DCDC] px-3 text-base bg-white focus:border-foreground outline-none";
let memoryVisitor: string | undefined;
function getVisitor() {
  memoryVisitor ??= crypto.randomUUID();
  try {
    const saved = localStorage.getItem("beitak_chat_visitor");
    if (saved) return saved;
    localStorage.setItem("beitak_chat_visitor", memoryVisitor);
  } catch { /* Storage may be blocked. */ }
  return memoryVisitor;
}
function track(payload: unknown, beacon = false) {
  const body = JSON.stringify(payload);
  try {
    if (beacon && typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/api/public/chat-event", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/public/chat-event", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch { /* Tracking must not interrupt WhatsApp. */ }
}
function HostForm({ onComplete }: { onComplete: (form: { fullName: string; type: string; location: string; maxGuests: number }) => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const fullName = String(values.get("fullName") ?? "").trim();
    const type = String(values.get("type") ?? "");
    const location = String(values.get("location") ?? "").trim();
    const maxGuests = Number(values.get("maxGuests"));
    const next: Record<string, string> = {};
    if (fullName.length < 2 || fullName.length > 100) next.fullName = "Enter a full name between 2 and 100 characters.";
    if (!["villa", "mansion", "cabin", "apartment", "hotel"].includes(type)) next.type = "Choose a type of guesthouse.";
    if (location.length < 2 || location.length > 150) next.location = "Enter a location between 2 and 150 characters.";
    if (!Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 500) next.maxGuests = "Enter a whole number from 1 to 500.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const message = `Hi Beitak! I'd like to list my guesthouse.\n\nFull name: ${fullName}\nType: ${type.charAt(0).toUpperCase() + type.slice(1)}\nLocation: ${location}\nMax guests: ${maxGuests}\n\n(Sent from the website assistant)`;
    window.open(buildWhatsAppHref(message), "_blank", "noopener,noreferrer");
    onComplete({ fullName, type, location, maxGuests });
  }
  return <form noValidate onSubmit={submit} className="self-stretch rounded-xl border border-[#E8E4E4] bg-white p-3 flex flex-col gap-2.5">
    <h3 className="text-sm font-semibold">List your property</h3>
    {([['fullName', 'Full name'], ['type', 'Type of guesthouse'], ['location', 'Location'], ['maxGuests', 'Max number of guests']] as const).map(([name, label]) => <label key={name} className="text-xs font-medium text-foreground flex flex-col gap-1">
      {label}
      {name === 'type' ? <select name={name} defaultValue="" className={fieldClass} aria-invalid={Boolean(errors[name])}><option value="" disabled>Choose a type</option>{['Villa', 'Mansion', 'Cabin', 'Apartment', 'Hotel'].map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}</select> : <input name={name} type={name === 'maxGuests' ? 'number' : 'text'} inputMode={name === 'maxGuests' ? 'numeric' : undefined} min={name === 'maxGuests' ? 1 : undefined} max={name === 'maxGuests' ? 500 : undefined} maxLength={name === 'fullName' ? 100 : name === 'location' ? 150 : undefined} placeholder={name === 'location' ? 'Town or area' : undefined} className={fieldClass} aria-invalid={Boolean(errors[name])} />}
      {errors[name] && <span className="text-xs text-[#B42318]" role="alert">{errors[name]}</span>}
    </label>)}
    <Button type="submit" className="w-full h-11 rounded-lg bg-[#CC0000] text-white font-semibold hover:bg-[#A30000]">Send on WhatsApp</Button>
  </form>;
}

export function ChatWidget() {
  const { pathname } = useLocation();
  const hidden = pathname.startsWith('/admin') || pathname.startsWith('/auth');
  const base = pathname.startsWith('/listing/') ? 92 : 20;
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(false);
  const [ready, setReady] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const visitor = useRef('');
  const busy = useRef(false);
  const opened = useRef(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    visitor.current = getVisitor();
    try {
      const raw = sessionStorage.getItem('beitak_chat_state');
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.conversationId === 'string') setConversationId(saved.conversationId);
        if (Array.isArray(saved.messages)) setMessages(saved.messages.filter((m: UIMessage) => m && typeof m.id === 'string' && typeof m.text === 'string' && ['user', 'assistant', 'error'].includes(m.role)));
      }
    } catch { /* Start fresh if storage is unavailable or invalid. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem('beitak_chat_state', JSON.stringify({ conversationId, messages })); } catch { /* In-memory conversation remains usable. */ }
  }, [conversationId, messages, ready]);
  useEffect(() => {
    if (hidden || opened.current) return;
    try { if (sessionStorage.getItem('beitak_chat_hint_seen')) return; } catch { /* Use in-memory state. */ }
    const timer = window.setTimeout(() => {
      if (opened.current) return;
      setHint(true);
      try { sessionStorage.setItem('beitak_chat_hint_seen', '1'); } catch { /* Optional hint. */ }
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [hidden]);
  useEffect(() => { if (hidden) setOpen(false); }, [hidden]);
  useEffect(() => {
    if (!open || hidden) return;
    opened.current = true;
    setHint(false);
    textarea.current?.focus();
    const media = window.matchMedia('(max-width: 639px)');
    const original = document.body.style.overflow;
    const update = () => { document.body.style.overflow = media.matches ? 'hidden' : original; };
    update(); media.addEventListener('change', update);
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', escape);
    return () => { document.body.style.overflow = original; media.removeEventListener('change', update); window.removeEventListener('keydown', escape); };
  }, [open, hidden]);
  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [messages, loading, open]);
  useEffect(() => {
    const input = textarea.current;
    if (input) { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 108)}px`; }
  }, [text, open]);
  async function send(value: string) {
    const message = value.trim().slice(0, 800);
    if (!message || busy.current || !ready) return;
    busy.current = true; setLoading(true); setText('');
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text: message }]);
    textarea.current?.focus();
    try {
      const response = await fetch('/api/public/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId, visitorId: visitor.current, message, pageUrl: window.location.href }) });
      const data = await response.json();
      if (typeof data.conversationId === 'string') setConversationId(data.conversationId);
      setMessages(prev => [...prev, response.ok ? { id: crypto.randomUUID(), role: 'assistant', text: data.reply, listings: data.listings, handoff: data.handoff, showHostForm: data.showHostForm } : { id: crypto.randomUUID(), role: 'error', text: data.error ?? fallbackError }]);
    } catch { setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'error', text: fallbackError }]); }
    finally { busy.current = false; setLoading(false); if (document.activeElement === document.body || document.activeElement === textarea.current) textarea.current?.focus(); }
  }
  if (hidden) return null;
  const visible = messages.length ? messages : [{ id: 'greeting', role: 'assistant' as const, text: greeting }];
  return <>
    {!open && <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp" style={{ bottom: base + 68, right: 24 }} className="fixed z-[9999] h-12 w-12 drop-shadow-[0_4px_10px_rgba(0,0,0,0.25)] hover:scale-105 transition"><WhatsAppLogo className="h-12 w-12" /></a>}
    {!open && hint && <div style={{ bottom: base + 10, right: 88 }} className="fixed z-[9999] hidden min-[380px]:flex items-center gap-2 bg-white rounded-[10px] shadow-[0_6px_18px_-6px_rgba(0,0,0,0.25)] text-[13px] font-semibold text-foreground px-3 py-2"><Button variant="ghost" onClick={() => setOpen(true)} className="p-0 h-auto hover:bg-transparent">Need help finding a stay?</Button><Button variant="ghost" size="icon" aria-label="Dismiss" className="h-5 w-5" onClick={() => setHint(false)}><X className="h-3 w-3" /></Button></div>}
    <Button aria-label={open ? 'Close Beitak assistant' : 'Open Beitak assistant'} aria-expanded={open} onClick={() => setOpen(prev => !prev)} style={{ bottom: base, right: 20 }} className={`fixed z-[9999] h-14 w-14 rounded-full text-white transition ${open ? 'hidden sm:flex bg-foreground hover:bg-foreground/90' : 'bg-[#CC0000] shadow-[0_8px_20px_-6px_rgba(204,0,0,0.55)] hover:bg-[#A30000]'}`}>{open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}</Button>
    {open && <div role="dialog" aria-label="Beitak assistant" aria-modal="true" style={{ '--chat-bottom': `${base + 72}px` } as React.CSSProperties} className="fixed inset-0 z-[10000] h-[100dvh] flex flex-col overflow-hidden bg-white text-foreground sm:inset-auto sm:right-5 sm:bottom-[var(--chat-bottom)] sm:z-[9999] sm:w-[384px] sm:h-[min(600px,calc(100dvh-140px))] sm:rounded-[18px] sm:shadow-[0_24px_60px_-12px_rgba(22,18,18,0.35)] sm:ring-1 sm:ring-black/5">
      <div className="px-5 py-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:pt-4 border-b border-[#EFEAEA] flex items-center gap-3 shrink-0"><p className="min-w-0 flex-1 font-['Fraunces',Georgia,'Times_New_Roman',serif] text-[21px] font-medium leading-tight tracking-[-0.01em] normal-case text-foreground">Beitak assistant</p><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted shrink-0" aria-label="Close" onClick={() => setOpen(false)}><X className="h-[18px] w-[18px]" /></Button></div>
      <div ref={list} className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-2.5" aria-live="polite" aria-busy={loading}>
        {visible.map(message => <div key={message.id} className="contents">
          <div className={`${bubble} ${message.role === 'user' ? 'self-end max-w-[80%] rounded-bl-[14px] rounded-br-[4px] bg-foreground text-white' : message.role === 'error' ? 'self-start bg-[#FDECEC] text-[#8A1F1F]' : 'self-start bg-[#F3F0F0] text-foreground'}`}>{message.text}{message.role === 'error' && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs underline">Message us on WhatsApp</a>}</div>
          {message.listings?.map(card => {
            const weekday = card.price_weekday ?? card.price_per_night;
            const weekend = card.price_weekend ?? card.price_per_night;
            const prices = [weekday, weekend].filter((n): n is number => n != null);
            const nightly = prices.length ? Math.min(...prices) : null;
            return <Link key={card.id} to="/listing/$id" params={{ id: card.id }} onClick={() => { if (window.innerWidth < 640) setOpen(false); }} className="flex gap-3 items-center p-2 rounded-xl border border-[#E8E4E4] bg-white hover:border-foreground/30 transition self-stretch">{card.cover ? <img src={card.cover} alt={card.title} loading="lazy" className="h-16 w-16 shrink-0 rounded-[9px] object-cover" /> : <div className="h-16 w-16 shrink-0 rounded-[9px] bg-muted" />}<div className="min-w-0"><p className="text-sm font-semibold line-clamp-1">{card.title}</p><p className="text-[12.5px] text-[#6B6363] line-clamp-1">{card.category ? `${card.category.charAt(0).toUpperCase() + card.category.slice(1)} in ` : ''}{card.location}</p>{card.max_guests != null && <p className="text-[12.5px] text-[#6B6363]">Up to {card.max_guests} guests</p>}{nightly != null && <p className="text-[13px]"><b>${nightly.toLocaleString('en-US')}</b> / night{weekend != null && weekday != null && weekend > weekday && <span className="text-[#6B6363]"> · ${weekend.toLocaleString('en-US')} weekends</span>}</p>}</div></Link>;
          })}
          {message.handoff && <a href={message.handoff.href} target="_blank" rel="noopener noreferrer" onClick={() => track({ conversationId, visitorId: visitor.current, type: 'handoff', listingId: message.handoff?.listingId, guests: message.handoff?.guests ?? undefined, checkIn: message.handoff?.checkIn ?? undefined }, true)} className="self-start inline-flex items-center gap-2 min-h-10 px-3.5 rounded-lg bg-[#CC0000] text-white text-[13.5px] font-semibold hover:bg-[#A30000]"><WhatsAppIcon className="h-4 w-4" />Continue on WhatsApp</a>}
          {message.showHostForm && !message.hostFormDone && <HostForm onComplete={form => { track({ conversationId, visitorId: visitor.current, type: 'host_form', form }); setMessages(prev => [...prev.map(m => m.id === message.id ? { ...m, hostFormDone: true } : m), { id: crypto.randomUUID(), role: 'assistant', text: 'Thanks! WhatsApp should open with your details, just press Send. Our team will get back to you soon.' }]); }} />}
        </div>)}
        {!messages.some(m => m.role === 'user') && <div className="flex flex-wrap gap-2">{[['Find a stay', "I'm looking for a place to stay"], ['How booking works', 'How does booking work?'], ['List my property', 'I want to list my property']].map(([label, value]) => <Button key={label} variant="outline" disabled={!ready || loading} className="rounded-full border-[1.5px] border-foreground px-3 min-h-[34px] h-auto py-1.5 text-[13px] font-semibold bg-white hover:bg-foreground hover:text-white" onClick={() => void send(value)}>{label}</Button>)}</div>}
        {loading && <div aria-label="Assistant is typing" className={`${bubble} self-start bg-[#F3F0F0] flex gap-1.5`}>{[0, 1, 2].map(i => <span key={i} style={{ animationDelay: `${i * 150}ms` }} className="h-2 w-2 rounded-full bg-[#8A8282] animate-pulse motion-reduce:animate-none" />)}</div>}
      </div>
      <form onSubmit={event => { event.preventDefault(); void send(text); }} className="border-t border-[#EFEAEA] px-3 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3 shrink-0"><div className="rounded-xl border-[1.5px] border-[#E2DCDC] focus-within:border-foreground p-1 pl-3.5 flex items-end gap-2"><textarea ref={textarea} rows={1} value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(text); } }} className="min-w-0 flex-1 max-h-[108px] resize-none bg-transparent outline-none text-base leading-6 py-1.5" placeholder="Ask about stays, dates, prices…" maxLength={800} aria-label="Message" /><Button type="submit" aria-label="Send" disabled={!text.trim() || loading || !ready} className="h-9 w-9 shrink-0 p-0 rounded-[9px] bg-foreground text-white hover:bg-foreground/90 disabled:opacity-40"><ArrowRight className="h-4 w-4" /></Button></div><p className="mt-2 text-[11.5px] leading-snug text-[#8A8282]">AI assistant. Chats are saved to help us improve. Availability and final prices are confirmed by our team on WhatsApp.</p></form>
    </div>}
  </>;
}
