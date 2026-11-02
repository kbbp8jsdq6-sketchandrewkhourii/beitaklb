import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogoTransparent } from "./LogoTransparent";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  LogOut,
  User as UserIcon,
  Instagram,
  Heart,
  List,
  CircleUserRound,
  LayoutDashboard,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { HamburgerMenu } from "./HamburgerMenu";

const GLASS =
  "bg-black/30 border border-white/40 backdrop-blur-md text-white hover:bg-black/45 transition-colors duration-300";
const GLASS_ROUND = `inline-flex h-11 w-11 items-center justify-center rounded-full ${GLASS}`;
const GLASS_PILL = `inline-flex h-10 items-center gap-1.5 rounded-full px-3 md:px-4 text-[13px] font-bold ${GLASS}`;
const TILE = "flex h-8 w-8 flex-none items-center justify-center rounded-[9px]";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [overlay, setOverlay] = useState(isHome);

  useEffect(() => {
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 40 && y > lastY) setScrolled(true);
      else if (y < lastY || y < 20) setScrolled(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isHome) {
      setOverlay(false);
      return;
    }
    let raf = 0;
    const compute = () => {
      raf = 0;
      const tracks = Array.from(document.querySelectorAll<HTMLElement>(".dnh-track"));
      const visible = tracks.find((t) => t.getBoundingClientRect().height > 0);
      setOverlay(visible ? visible.getBoundingClientRect().bottom > 80 : false);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isHome]);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const accountMenu = (
    <DropdownMenuContent align="end" className="w-60">
      <DropdownMenuItem asChild className="min-h-11 gap-3">
        <Link to="/profile" className="cursor-pointer">
          <span className={`${TILE} bg-[#F4F4F4]`}>
            <CircleUserRound size={17} stroke="#141414" />
          </span>
          Profile
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="min-h-11 gap-3">
        <Link to="/favorites" className="cursor-pointer">
          <span className={`${TILE} bg-[#FDECEC]`}>
            <Heart size={17} fill="#CC0000" stroke="#CC0000" />
          </span>
          Favorites
        </Link>
      </DropdownMenuItem>
      {isAdmin && (
        <DropdownMenuItem asChild className="min-h-11 gap-3">
          <Link to="/admin" className="cursor-pointer">
            <span className={`${TILE} bg-[#141414]`}>
              <LayoutDashboard size={17} stroke="white" />
            </span>
            Admin dashboard
          </Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleSignOut} className="min-h-11 cursor-pointer gap-3 text-destructive">
        <span className={TILE}>
          <LogOut className="h-4 w-4" />
        </span>
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  if (isHome && overlay) {
    return (
      <header className="fixed inset-x-0 top-0 z-40 bg-transparent transition-colors duration-300">
        <div className="flex h-auto w-full items-center justify-between gap-2 p-[18px] md:p-6">
          <Link to="/" className="ml-[2px] flex items-center md:ml-0" aria-label="BEITAK home">
            <img
              src="/beitak-logo-white.png"
              alt="BEITAK"
              className="block h-10 w-auto md:h-[52px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
            />
          </Link>
          <nav className="flex items-center gap-1.5">
            <a
              href="https://wa.me/96181160435"
              target="_blank"
              rel="noopener noreferrer"
              className={`${GLASS_PILL} hidden md:inline-flex`}
            >
              <WhatsAppIcon className="h-4 w-4" />
              Contact
            </a>
            <Link to="/search" className={`${GLASS_PILL} hidden md:inline-flex`}>
              <List className="h-4 w-4" />
              Listings
            </Link>
            <Link to="/favorites" aria-label="My favorites" className={GLASS_ROUND}>
              <Heart className="h-5 w-5" />
            </Link>
            <a
              href="https://instagram.com/beitak.lb"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow @beitak.lb on Instagram"
              className={`${GLASS_ROUND} hidden sm:inline-flex`}
            >
              <Instagram className="h-5 w-5" />
            </a>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Account menu"
                    className={`${GLASS_ROUND} md:h-10 md:w-auto md:gap-1.5 md:px-4 md:text-[13px] md:font-bold`}
                  >
                    <UserIcon className="h-5 w-5 md:h-4 md:w-4" />
                    <span className="hidden md:inline">Account</span>
                  </button>
                </DropdownMenuTrigger>
                {accountMenu}
              </DropdownMenu>
            ) : (
              <>
                <Link to="/auth/login" className={GLASS_PILL}>
                  Log in
                </Link>
                <Link
                  to="/auth/signup"
                  className="inline-flex h-10 items-center rounded-full bg-[#CC0000] px-3.5 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] md:px-[18px]"
                >
                  Sign up
                </Link>
              </>
            )}
            <HamburgerMenu triggerClassName={GLASS_ROUND} />
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`glass-light ${isHome ? "fixed inset-x-0 top-0" : "sticky top-0"} z-40 transition-colors duration-300 ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className={`flex items-center ${!isHome ? "pl-12 sm:pl-2" : ""}`}
          aria-label="BEITAK home"
        >
          <LogoTransparent size="navbar" />
        </Link>

        <nav className="flex items-center gap-2">
          <a
            href="https://wa.me/96181160435"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            Contact
          </a>
          <Link
            to="/search"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition hover:border-primary hover:text-primary"
          >
            <List className="h-3.5 w-3.5" />
            Listings
          </Link>
          <Link
            to="/favorites"
            aria-label="My favorites"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
            activeProps={{ className: "text-primary" }}
          >
            <Heart className="h-5 w-5" />
          </Link>
          <a
            href="https://instagram.com/beitak.lb"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow @beitak.lb on Instagram"
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-[#E1306C]"
          >
            <Instagram className="h-5 w-5" />
          </a>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-full" aria-label="Account menu">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Account</span>
                </Button>
              </DropdownMenuTrigger>
              {accountMenu}
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="gap-2">
                <Link to="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
          <HamburgerMenu />
        </nav>
      </div>
    </header>
  );
}
