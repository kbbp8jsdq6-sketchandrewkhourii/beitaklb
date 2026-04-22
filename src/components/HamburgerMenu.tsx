import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Home,
  Building2,
  Info,
  MessageSquare,
  UserPlus,
  Heart,
  MessageCircle,
  FileText,
  Share2,
  Instagram,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const TIKTOK_URL = "https://www.tiktok.com/@beitak.lb?_r=1&_t=ZS-95kaRlKp5d6";
const INSTAGRAM_URL = "https://instagram.com/beitak.lb";
const WHATSAPP_URL = "https://wa.me/96181160435";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.85a8.16 8.16 0 0 0 4.77 1.52V7a4.85 4.85 0 0 1-1.84-.31z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.11 17.32c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.1 4.5.71.31 1.27.5 1.7.64.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM16.02 5.33c-5.92 0-10.73 4.81-10.74 10.72 0 1.89.49 3.74 1.43 5.36L5.2 26.67l5.42-1.42a10.7 10.7 0 0 0 5.39 1.45h.01c5.92 0 10.73-4.81 10.74-10.72a10.66 10.66 0 0 0-3.14-7.59 10.66 10.66 0 0 0-7.59-3.16z" />
    </svg>
  );
}

interface MenuLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
  search?: Record<string, string>;
}

function MenuLink({ to, icon, label, onSelect, search }: MenuLinkProps) {
  return (
    <Link
      to={to}
      search={search}
      onClick={onSelect}
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-primary/10 hover:text-primary"
      activeProps={{ className: "bg-primary/10 text-primary" }}
      activeOptions={{ exact: to === "/" }}
    >
      <span className="text-muted-foreground transition group-hover:text-primary">{icon}</span>
      {label}
    </Link>
  );
}

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [socialsOpen, setSocialsOpen] = useState(false);
  const { user } = useAuth();

  const close = () => {
    setOpen(false);
    setPropsOpen(false);
    setAboutOpen(false);
    setSocialsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-accent hover:text-primary"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              key="drawer"
              role="dialog"
              aria-label="Site menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-50 flex h-full w-[88vw] max-w-sm flex-col bg-background shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <p className="font-display text-xl tracking-wide text-foreground">
                  BEI<span className="text-primary">TAK</span>
                </p>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-primary/10 hover:text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <MenuLink to="/" icon={<Home className="h-4 w-4" />} label="Home" onSelect={close} />

                {/* Properties */}
                <button
                  type="button"
                  onClick={() => setPropsOpen((v) => !v)}
                  aria-expanded={propsOpen}
                  className="mt-1 flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-primary/10 hover:text-primary"
                >
                  <span className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Properties
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${propsOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {propsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden pl-9"
                    >
                      <Link
                        to="/search"
                        onClick={close}
                        className="block rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-primary/10 hover:text-primary"
                      >
                        All properties
                      </Link>
                      <Link
                        to="/search"
                        search={{ category: "villa" }}
                        onClick={close}
                        className="block rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-primary/10 hover:text-primary"
                      >
                        Villas
                      </Link>
                      <Link
                        to="/search"
                        search={{ category: "cabin" }}
                        onClick={close}
                        className="block rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-primary/10 hover:text-primary"
                      >
                        Cabins
                      </Link>
                      <Link
                        to="/search"
                        search={{ category: "apartment" }}
                        onClick={close}
                        className="block rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-primary/10 hover:text-primary"
                      >
                        Apartments
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* About us */}
                <button
                  type="button"
                  onClick={() => setAboutOpen((v) => !v)}
                  aria-expanded={aboutOpen}
                  className="mt-1 flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-primary/10 hover:text-primary"
                >
                  <span className="flex items-center gap-3">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    About us
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${aboutOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {aboutOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden pl-9"
                    >
                      <Link
                        to="/about"
                        hash="mission"
                        onClick={close}
                        className="block rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-primary/10 hover:text-primary"
                      >
                        Our Mission
                      </Link>
                      <Link
                        to="/about"
                        hash="vision"
                        onClick={close}
                        className="block rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-primary/10 hover:text-primary"
                      >
                        Our Vision
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>

                <MenuLink
                  to="/contact"
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="Contact"
                  onSelect={close}
                />
                <MenuLink
                  to="/become-a-host"
                  icon={<UserPlus className="h-4 w-4" />}
                  label="Become a host"
                  onSelect={close}
                />

                {user && (
                  <MenuLink
                    to="/favorites"
                    icon={<Heart className="h-4 w-4" />}
                    label="Favorites"
                    onSelect={close}
                  />
                )}

                <MenuLink
                  to="/feedback"
                  icon={<MessageCircle className="h-4 w-4" />}
                  label="Feedback"
                  onSelect={close}
                />
                <MenuLink
                  to="/terms"
                  icon={<FileText className="h-4 w-4" />}
                  label="Terms and conditions"
                  onSelect={close}
                />

                {/* Socials */}
                <button
                  type="button"
                  onClick={() => setSocialsOpen((v) => !v)}
                  aria-expanded={socialsOpen}
                  className="mt-1 flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-primary/10 hover:text-primary"
                >
                  <span className="flex items-center gap-3">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                    Socials
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${socialsOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {socialsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden pl-9"
                    >
                      <a
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={close}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-primary/10 hover:text-[#E1306C]"
                      >
                        <Instagram className="h-4 w-4" /> Instagram
                      </a>
                      <a
                        href={WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={close}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-primary/10 hover:text-[#25D366]"
                      >
                        <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                      </a>
                      <a
                        href={TIKTOK_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={close}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-primary/10 hover:text-primary"
                      >
                        <TikTokIcon className="h-4 w-4" /> TikTok
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </nav>

              <div className="border-t border-border px-5 py-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Home is closer than you think
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
