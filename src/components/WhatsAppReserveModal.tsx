import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WhatsAppReserveModal({ open, loading = false, onConfirm, onCancel }: Props) {
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
            aria-labelledby="wa-modal-title"
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-background p-7 shadow-2xl ring-1 ring-black/5"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="wa-modal-title" className="font-display text-2xl text-foreground">
              Before you reserve 📋
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-foreground/85">
              <li className="rounded-xl border border-border bg-card px-4 py-3">
                ⚠️ Prices may vary on public holidays and special occasions
              </li>
              <li className="rounded-xl border border-border bg-card px-4 py-3">
                ✅ Final price is confirmed after inquiry with the host
              </li>
            </ul>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Continue to WhatsApp"
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
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
