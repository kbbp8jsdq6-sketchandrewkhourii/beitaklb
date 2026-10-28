import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buildListingMessage, buildWhatsAppHref } from "@/lib/whatsapp";

interface Props {
  open: boolean;
  onCancel: () => void;
  listingId: string;
  listingTitle: string;
  listingLocation: string;
  priceWeekday: number | null;
  priceWeekend: number | null;
  listingUrl: string;
  defaultGuests?: number;
  maxGuests?: number;
  phoneNumber?: string;
}

type DateRange = { checkIn: string; checkOut: string };
const emptyRange = (): DateRange => ({ checkIn: "", checkOut: "" });
const localIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromIso = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const dayLabel = (iso: string) => new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(fromIso(iso));
const nightsBetween = (start: string, end: string) => {
  const a = fromIso(start);
  const b = fromIso(end);
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
};

// Scoped calendar tokens keep the requested palette isolated from the rest of the site.
const calendarStyles = `
.reserve-calendar {
  --reserve-paper: #FFFFFF; --reserve-ink: #141414; --reserve-red: #CC0000;
  --reserve-label: #555555; --reserve-placeholder: #767676; --reserve-line: #E5E5E5;
  --reserve-track: #F2F2F2; --reserve-disabled: #ABABAB; --reserve-main-band: #FDECEC;
  --reserve-main-text: #990000; --reserve-backup-band: #EDEDED; --reserve-step-border: #D9D9D9;
  --reserve-cta-disabled: #6B6B6B; --reserve-backdrop: #00000099;
  background: var(--reserve-backdrop);
}
.reserve-calendar .reserve-dialog { background: var(--reserve-paper); color: var(--reserve-ink); }
.reserve-calendar .reserve-round { border: 1px solid var(--reserve-line); }
.reserve-calendar .reserve-label { color: var(--reserve-label); }
.reserve-calendar .reserve-box { border: 1px solid var(--reserve-line); }
.reserve-calendar .reserve-box[data-picking="true"] { border: 1.5px solid var(--reserve-red); }
.reserve-calendar .reserve-empty { color: var(--reserve-placeholder); }
.reserve-calendar .reserve-track { background: var(--reserve-track); }
.reserve-calendar .reserve-tab[data-active="true"] { background: var(--reserve-red); color: var(--reserve-paper); }
.reserve-calendar .reserve-tab[data-backup="true"][data-active="true"] { background: var(--reserve-ink); }
.reserve-calendar .reserve-dot { background: var(--reserve-red); }
.reserve-calendar .reserve-day { position: relative; isolation: isolate; }
.reserve-calendar .reserve-day::before { content: ""; position: absolute; top: 3px; height: 40px; z-index: -1; background: var(--reserve-main-band); }
.reserve-calendar .reserve-day[data-band="middle"]::before { left: 0; right: 0; }
.reserve-calendar .reserve-day[data-band="start"]::before { left: 50%; right: 0; }
.reserve-calendar .reserve-day[data-band="end"]::before { left: 0; right: 50%; }
.reserve-calendar .reserve-day[data-backup="true"]::before { background: var(--reserve-backup-band); }
.reserve-calendar .reserve-day[data-band="middle"] { color: var(--reserve-main-text); }
.reserve-calendar .reserve-day[data-backup="true"][data-band="middle"] { color: var(--reserve-ink); }
.reserve-calendar .reserve-number[data-today="true"] { box-shadow: inset 0 0 0 1.5px var(--reserve-ink); color: var(--reserve-ink); }
.reserve-calendar .reserve-number[data-endpoint="true"] { background: var(--reserve-red); color: var(--reserve-paper); box-shadow: none; }
.reserve-calendar .reserve-day[data-backup="true"] .reserve-number[data-endpoint="true"] { background: var(--reserve-ink); }
.reserve-calendar .reserve-day:disabled .reserve-number { color: var(--reserve-disabled); text-decoration: line-through; }
.reserve-calendar .reserve-summary { background: var(--reserve-main-band); }
.reserve-calendar .reserve-red { color: var(--reserve-red); }
.reserve-calendar .reserve-step { border: 1px solid var(--reserve-step-border); }
.reserve-calendar .reserve-cta { background: var(--reserve-red); color: var(--reserve-paper); }
.reserve-calendar .reserve-cta:disabled { background: var(--reserve-line); color: var(--reserve-cta-disabled); }
.reserve-calendar .reserve-handle { background: var(--reserve-step-border); }
`;

export function ReserveDetailsModal({
  open, onCancel, listingId, listingTitle, listingLocation, listingUrl,
  defaultGuests, maxGuests = 20, phoneNumber,
}: Props) {
  const guestLimit = Number.isFinite(maxGuests) ? Math.max(1, Math.floor(maxGuests)) : 20;
  const [main, setMain] = useState<DateRange>(emptyRange);
  const [backup, setBackup] = useState<DateRange>(emptyRange);
  const [tab, setTab] = useState<"main" | "backup">("main");
  const [guests, setGuests] = useState(1);
  const [today, setToday] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [month, setMonth] = useState({ year: 2026, month: 0 });
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    const limit = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
    setToday(localIso(now));
    setLastDate(localIso(limit));
    setMonth({ year: now.getFullYear(), month: now.getMonth() });
    setMain(emptyRange());
    setBackup(emptyRange());
    setTab("main");
    setGuests(Math.min(guestLimit, Math.max(1, Math.floor(defaultGuests ?? 1))));
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [open, defaultGuests, guestLimit]);

  const range = tab === "main" ? main : backup;
  const setRange = tab === "main" ? setMain : setBackup;
  const complete = !!(main.checkIn && main.checkOut);
  const backupComplete = !!(backup.checkIn && backup.checkOut);
  const nights = complete ? nightsBetween(main.checkIn, main.checkOut) : 0;
  const firstDay = new Date(month.year, month.month, 1);
  const monthKey = localIso(firstDay).slice(0, 7);
  const offset = (firstDay.getDay() + 6) % 7;
  const days = new Date(month.year, month.month + 1, 0).getDate();
  const prevDisabled = !today || monthKey <= today.slice(0, 7);
  const nextDisabled = !lastDate || monthKey >= lastDate.slice(0, 7);

  const switchTab = (next: "main" | "backup") => {
    setTab(next);
    const selected = next === "main" ? main : backup;
    const date = fromIso(selected.checkIn || today);
    setMonth({ year: date.getFullYear(), month: date.getMonth() });
  };
  const selectDay = (iso: string) => {
    if (iso < today || iso > lastDate) return;
    if (!range.checkIn || range.checkOut || iso <= range.checkIn) {
      setRange({ checkIn: iso, checkOut: "" });
    } else {
      setRange({ ...range, checkOut: iso });
    }
  };
  const moveMonth = (delta: number) => {
    const date = new Date(month.year, month.month + delta, 1);
    setMonth({ year: date.getFullYear(), month: date.getMonth() });
  };
  const handleContinue = () => {
    if (!complete || main.checkOut <= main.checkIn) return;
    const backupCheckIn = backupComplete ? backup.checkIn : undefined;
    const backupCheckOut = backupComplete ? backup.checkOut : undefined;
    const message = buildListingMessage({
      title: listingTitle, location: listingLocation, url: listingUrl,
      checkIn: main.checkIn, checkOut: main.checkOut, backupCheckIn, backupCheckOut, guests,
    });
    const url = buildWhatsAppHref(message, phoneNumber);
    // Fire-and-forget: log the reservation click without blocking navigation.
    supabase.from("reservation_clicks").insert({
      listing_id: listingId, guests, requested_date: main.checkIn, requested_checkout: main.checkOut,
      backup_date: backupCheckIn ?? null, backup_checkout: backupCheckOut ?? null,
    }).then(({ error }) => {
      if (error) console.error("Failed to log reservation click:", error);
    });
    window.open(url, "_blank", "noopener,noreferrer");
    onCancel();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="reserve-calendar fixed inset-0 z-[60] flex items-end justify-center backdrop-blur-sm md:items-center md:px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }} onClick={onCancel}
        >
          <style>{calendarStyles}</style>
          <motion.div
            role="dialog" aria-modal="true" aria-labelledby="reserve-modal-title"
            className="reserve-dialog relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] p-5 shadow-2xl md:max-w-md md:rounded-3xl"
            initial={{ opacity: 0, scale: mobile ? 1 : 0.92, y: mobile ? "100%" : 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: mobile ? 1 : 0.95, y: mobile ? "100%" : 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }} onClick={(e) => e.stopPropagation()}
          >
            <div className="reserve-handle mx-auto mb-4 h-1 w-10 rounded-full md:hidden" aria-hidden="true" />
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h2 id="reserve-modal-title" className="font-display text-[34px] leading-none">Reserve details</h2>
                <button type="button" aria-label="Close" onClick={onCancel} className="reserve-round flex h-11 w-11 shrink-0 items-center justify-center rounded-full"><X className="h-5 w-5" aria-hidden="true" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["checkIn", "checkOut"] as const).map((field) => (
                  <button key={field} type="button" className="reserve-box rounded-[14px] px-3.5 py-2.5 text-left"
                    data-picking={field === "checkIn" ? !range.checkIn : !!range.checkIn && !range.checkOut}
                    onClick={() => {
                      if (field === "checkIn") setRange(emptyRange());
                      else if (range.checkIn) setRange({ ...range, checkOut: "" });
                    }}>
                    <span className="reserve-label block text-[11px] font-bold tracking-[0.06em]">{field === "checkIn" ? "CHECK-IN" : "CHECK-OUT"}</span>
                    <span className={`mt-1 block text-[15px] font-semibold ${range[field] ? "" : "reserve-empty"}`}>{range[field] ? dayLabel(range[field]) : "Add date"}</span>
                  </button>
                ))}
              </div>
              <div>
                <div className="reserve-track grid grid-cols-2 rounded-full p-1">
                  <button type="button" aria-pressed={tab === "main"} onClick={() => switchTab("main")} data-active={tab === "main"} className="reserve-tab h-10 rounded-full text-[13px] font-bold">Your dates</button>
                  <button type="button" aria-pressed={tab === "backup"} onClick={() => switchTab("backup")} data-active={tab === "backup"} data-backup="true" className="reserve-tab flex h-10 items-center justify-center gap-2 rounded-full text-[13px] font-bold">Backup dates{tab === "main" && backupComplete && <span className="reserve-dot h-1.5 w-1.5 rounded-full" aria-hidden="true" />}</button>
                </div>
                <p className="reserve-label mt-2 text-xs leading-5">{tab === "backup" ? "Optional. We check these if your first dates are taken." : backupComplete ? `Backup: ${dayLabel(backup.checkIn)} to ${dayLabel(backup.checkOut)}` : "Tap your check-in day, then your check-out day."}</p>
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <button type="button" aria-label="Previous month" disabled={prevDisabled} onClick={() => moveMonth(-1)} className="reserve-round flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-[0.35]"><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button>
                  <span aria-live="polite" className="font-display text-2xl tracking-[0.04em]">{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(firstDay)}</span>
                  <button type="button" aria-label="Next month" disabled={nextDisabled} onClick={() => moveMonth(1)} className="reserve-round flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-[0.35]"><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
                </div>
                <div className="grid grid-cols-7">
                  {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((day) => <span key={day} className="reserve-label mb-2 text-center text-[11px] font-bold">{day}</span>)}
                  {Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} className="h-[46px]" aria-hidden="true" />)}
                  {Array.from({ length: days }, (_, i) => {
                    const iso = localIso(new Date(month.year, month.month, i + 1));
                    const disabled = !today || iso < today || iso > lastDate;
                    const endpoint = iso === range.checkIn || iso === range.checkOut;
                    const band = range.checkIn && range.checkOut ? iso === range.checkIn ? "start" : iso === range.checkOut ? "end" : iso > range.checkIn && iso < range.checkOut ? "middle" : undefined : undefined;
                    return <button key={iso} type="button" disabled={disabled} aria-label={`${dayLabel(iso)}${disabled ? ", unavailable" : ""}`} aria-pressed={endpoint}
                      data-band={band} data-backup={tab === "backup"} onClick={() => selectDay(iso)} className="reserve-day flex h-[46px] min-w-0 items-center justify-center text-sm font-semibold">
                      <span data-today={iso === today} data-endpoint={endpoint} className="reserve-number flex h-10 w-10 shrink-0 items-center justify-center rounded-full">{i + 1}</span>
                    </button>;
                  })}
                </div>
              </div>
              <div className="reserve-summary flex items-center gap-2 rounded-[14px] px-3.5 py-3" aria-live="polite">
                <CalendarDays className="reserve-red h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="text-sm font-bold">{complete ? `${nights} ${nights === 1 ? "night" : "nights"} selected` : "Select your check-out day"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div><p className="text-sm font-bold">Guests</p><p className="reserve-label text-[11px]">Up to {guestLimit} guests</p></div>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label="Decrease guests" disabled={guests <= 1} onClick={() => setGuests((g) => Math.max(1, g - 1))} className="reserve-step flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-[0.35]"><Minus className="h-4 w-4" aria-hidden="true" /></button>
                  <span className="min-w-7 text-center text-sm font-bold">{guests}</span>
                  <button type="button" aria-label="Increase guests" disabled={guests >= guestLimit} onClick={() => setGuests((g) => Math.min(guestLimit, g + 1))} className="reserve-step flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-[0.35]"><Plus className="h-4 w-4" aria-hidden="true" /></button>
                </div>
              </div>
              <div>
                <button type="button" disabled={!complete} onClick={handleContinue} className="reserve-cta flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] text-sm font-bold uppercase tracking-[0.04em]"><WhatsAppIcon className="h-5 w-5" />Continue to WhatsApp</button>
                <button type="button" onClick={() => setRange(emptyRange())} className="reserve-label mt-1 h-11 w-full text-[13px] font-semibold underline">Clear dates</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
