import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";

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
      { title: "BEITAK — Home Is Closer Than You Think" },
      {
        name: "description",
        content:
          "Discover and book unique homes across Lebanon — from Beirut rooftops to Bcharre cedars. BEITAK connects you with authentic Lebanese stays.",
      },
      { property: "og:title", content: "BEITAK — Home Is Closer Than You Think" },
      {
        property: "og:description",
        content: "Property rentals across Lebanon's most beautiful villages and cities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "BEITAK — Home Is Closer Than You Think" },
      { name: "description", content: "Beitak.lb is a real estate platform for finding and booking guesthouses." },
      { property: "og:description", content: "Beitak.lb is a real estate platform for finding and booking guesthouses." },
      { name: "twitter:description", content: "Beitak.lb is a real estate platform for finding and booking guesthouses." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8589acf6-7b92-4a77-94bb-b002b50011f7/id-preview-09abcac8--9b3af1ab-98df-4b5c-be47-030404eee3e1.lovable.app-1776784593588.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8589acf6-7b92-4a77-94bb-b002b50011f7/id-preview-09abcac8--9b3af1ab-98df-4b5c-be47-030404eee3e1.lovable.app-1776784593588.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
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
        <Outlet />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
