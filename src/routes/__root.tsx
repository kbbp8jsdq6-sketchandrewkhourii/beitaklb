import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { VerifyEmailGate } from "@/components/VerifyEmailGate";
import { BackButton } from "@/components/BackButton";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { MaintenanceGate } from "@/components/MaintenanceGate";
import { CustomCursor } from "@/components/CustomCursor";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to BEITAK
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "robots", content: "index, follow" },
      // Google Search Console verification — replace content value with your verification code
      { name: "google-site-verification", content: "o_qzU6fjkHKfA8AAoWNbLn_5hlazjpwcLn9LhdzeZiI" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "BEITAK" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://beitaklb.lovable.app/" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SiteGate />
        <BackButton />
        <FloatingWhatsApp />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

/**
 * Globally enforces email verification: any signed-in user whose email is
 * unverified is shown the verify-email screen and cannot browse the site.
 * Auth routes (/auth/*) are exempt so they can complete sign-in/verification.
 */
function SiteGate() {
  const { user, isVerified, loading } = useAuth();
  const { pathname } = useLocation();

  const isAuthRoute = pathname.startsWith("/auth");

  if (!loading && user && !isVerified && !isAuthRoute) {
    return (
      <MaintenanceGate>
        <VerifyEmailGate requireAuth={false}>
          <Outlet />
        </VerifyEmailGate>
      </MaintenanceGate>
    );
  }

  return (
    <MaintenanceGate>
      <Outlet />
    </MaintenanceGate>
  );
}
