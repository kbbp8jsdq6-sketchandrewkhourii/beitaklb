import { useQuery } from "@tanstack/react-query";
import { Outlet, useLocation } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reads site_settings.maintenance_mode and shows a maintenance screen for
 * non-admin visitors when it's on. Admins and /admin/* and /auth/* routes
 * always get through so they can turn maintenance off again.
 */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  const { pathname } = useLocation();

  const q = useQuery({
    queryKey: ["maintenance-mode"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("maintenance_mode")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return !!data?.maintenance_mode;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const bypass =
    isAdmin || pathname.startsWith("/admin") || pathname.startsWith("/auth");

  if (q.data && !bypass) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 font-display text-4xl text-foreground">
            We'll be right back
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            BEITAK is undergoing scheduled maintenance. Please check back in a
            little while.
          </p>
          <p className="mt-6 text-xs text-muted-foreground">
            Need to reach us urgently?{" "}
            <a
              href="mailto:beitaklb@gmail.com"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              beitaklb@gmail.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function MaintenanceOutletGate() {
  return (
    <MaintenanceGate>
      <Outlet />
    </MaintenanceGate>
  );
}
