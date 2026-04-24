import { AnimatePresence, motion } from "framer-motion";

interface Props {
  open: boolean;
  onCancel: () => void;
  href: string;
}

export function WhatsAppReserveModal({ open, onCancel, href }: Props) {
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

            <div className="mt-6 text-center">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "#E63030",
                  color: "white",
                  padding: "12px 28px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "bold",
                  display: "inline-block",
                }}
              >
                Continue to WhatsApp
              </a>
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
