import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Home as HomeIcon,
  Users,
  ClipboardCheck,
  ArrowLeft,
  MessageCircle,
  Mail,
  Megaphone,
  Settings,
  Star,
  Images,
} from "lucide-react";
import { LogoTransparent } from "@/components/LogoTransparent";

type NavItem = {
  to:
    | "/admin"
    | "/admin/listings"
    | "/admin/featured"
    | "/admin/hero-images"
    | "/admin/users"
    | "/admin/approvals"
    | "/admin/feedback"
    | "/admin/contact"
    | "/admin/announcements"
    | "/admin/settings";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/listings", label: "Listings", icon: HomeIcon },
  { to: "/admin/featured", label: "Featured Listings", icon: Star },
  { to: "/admin/hero-images", label: "Hero Images", icon: Images },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/approvals", label: "Approvals", icon: ClipboardCheck },
  { to: "/admin/feedback", label: "Feedback", icon: MessageCircle },
  { to: "/admin/contact", label: "Contact", icon: Mail },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  return (
    <aside className="glass hidden w-60 shrink-0 lg:block">
      <div className="sticky top-0 flex h-screen flex-col p-4">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <LogoTransparent size="navbar" />
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: !!item.exact }}
                activeProps={{
                  className:
                    "flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary",
                }}
                inactiveProps={{
                  className:
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          to="/"
          className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to site
        </Link>
      </div>
    </aside>
  );
}

/**
 * Mobile horizontal nav for admin sections (visible on screens <lg).
 */
export function AdminMobileNav() {
  return (
    <div className="lg:hidden">
      <div className="glass flex gap-2 overflow-x-auto px-4 py-2 hide-scrollbar">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: !!item.exact }}
              activeProps={{
                className:
                  "inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground",
              }}
              inactiveProps={{
                className:
                  "inline-flex shrink-0 items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
