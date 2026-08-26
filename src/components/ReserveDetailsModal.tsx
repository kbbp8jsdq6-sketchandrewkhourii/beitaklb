import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

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
  phoneNumber?: string;
}

/** Formats an ISO yyyy-mm-dd string as "Sep 5, 2026". */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function ReserveDetailsModal({
  open,
  onCancel,
  listingTitle,
  listingLocation,
  priceWeekday,
  priceWeekend,
  listingUrl,
  defaultGuests,
  phoneNumber,
}: Props) {
  const [date, setDate] = useState("");
  const [altDate, setAltDate] = useState("");
  const [showAlt, setShowAlt] = useState(false);
  const [guests, setGuests] = useState(defaultGuests ?? 1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setGuests(Math.min(20, Math.max(1, defaultGuests ?? 1)));
    }
  }, [open, defaultGuests]);

  const handleContinue = () => {
    if (!date) {
      setError("Please select a date");
      return;
    }
    const lines = [
      "Hi Beitak! 👋",
      "",
      "I'm interested in the following listing:",
      "",
      `🏠 *${listingTitle}*`,
      `📍 *${listingLocation}*`,
      `💰 Weekday: $${priceWeekday ?? "-"} / night | Weekend: $${priceWeekend ?? "-"} / night`,
      "",
      `📅 Preferred date: ${formatDate(date)}`,
      ...(altDate ? [`🔁 Backup date: ${formatDate(altDate)}`] : []),
      `👥 Guests: ${guests}`,
      "",
      "⚠️ I understand prices may vary on public holidays and that the final price is confirmed after inquiry.",
      "",
      `View listing: ${listingUrl}`,
      "",
      "Could you help me with availability and booking?",
    ];
    const number = (phoneNumber ?? WHATSAPP_NUMBER).replace(/[^\d]/g, "");
    const url = `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onCancel();
  };

  const inputClass =
    "w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onCancel}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reserve-modal-title"
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-background p-7 shadow-2xl ring-1 ring-black/5"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reserve-modal-title" className="font-display text-2xl text-foreground">
              Reserve details 📋
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="reserve-date" className="mb-1.5 block text-sm font-semibold text-foreground">
                  When do you need it?
                </label>
                <input
                  id="reserve-date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (e.target.value) setError(null);
                  }}
                  className={inputClass}
                />
                {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
                {!showAlt && (
                  <button
                    type="button"
                    onClick={() => setShowAlt(true)}
                    className="mt-2 text-xs font-semibold text-primary transition hover:underline"
                  >
                    + Add a backup date in case it's booked
                  </button>
                )}
              </div>

              {showAlt && (
                <div>
                  <label htmlFor="reserve-alt-date" className="mb-1.5 block text-sm font-semibold text-foreground">
                    Alternate date
                  </label>
                  <input
                    id="reserve-alt-date"
                    type="date"
                    value={altDate}
                    onChange={(e) => setAltDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <span className="mb-1.5 block text-sm font-semibold text-foreground">Guests</span>
                <div className="flex items-center justify-center gap-4 rounded-full border border-border bg-background px-4 py-2">
                  <button
                    type="button"
                    aria-label="Decrease guests"
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-muted"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[28px] text-center text-sm font-bold">{guests}</span>
                  <button
                    type="button"
                    aria-label="Increase guests"
                    onClick={() => setGuests((g) => Math.min(20, g + 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-muted"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-7 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
              >
                Continue to WhatsApp
              </button>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 block w-full text-center text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
