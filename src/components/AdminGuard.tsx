import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

/**
 * Wraps an admin-only page. Renders the page only when the current user has
 * the admin role. Otherwise shows a clear "not authorized" screen.
 *
 * Note: `loading` here covers BOTH the initial auth check AND the role lookup
 * (we treat unknown role as "still loading" until we've actually checked).
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto mt-20 max-w-md text-center">
          <Shield className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 font-display text-3xl">Admin login required</h1>
          <Button asChild className="mt-4">
            <Link to="/auth/login">Log in</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto mt-20 max-w-md text-center">
          <Shield className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 font-display text-3xl">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You need admin privileges to view this page.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
