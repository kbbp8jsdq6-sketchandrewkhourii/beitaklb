import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin } from "lucide-react";

export const Route = createFileRoute("/bookings/")({
  head: () => ({ meta: [{ title: "My bookings — BEITAK" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: BookingsPage,
});

function BookingsPage() {
  const { user, loading } = useAuth();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id, check_in, check_out, guests, total_price, status, created_at,
          listings(id, title, location, listing_photos(photo_url, display_order))
        `)
        .eq("guest_id", user!.id)
        .order("check_in", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto mt-20 max-w-md text-center">
          <h1 className="font-display text-3xl">Log in to view your trips</h1>
          <Link to="/auth/login" className="mt-4 inline-block font-semibold text-primary hover:underline">
            Log in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl text-foreground">My trips</h1>
        <p className="mt-1 text-muted-foreground">Your upcoming and past stays on BEITAK.</p>

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : bookings.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-muted/40 p-12 text-center">
            <p className="font-display text-2xl">No trips yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Start exploring Lebanon.</p>
            <Link to="/" className="mt-4 inline-block font-semibold text-primary hover:underline">
              Find a stay →
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {bookings.map((b) => {
              const photos = (b.listings?.listing_photos ?? []).slice().sort((a, c) => a.display_order - c.display_order);
              const cover = photos[0]?.photo_url;
              return (
                <li key={b.id}>
                  <Link
                    to="/listing/$id"
                    params={{ id: b.listings?.id ?? "" }}
                    className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition hover:shadow-lg sm:flex-row"
                  >
                    <div className="aspect-[16/9] sm:aspect-auto sm:w-56 sm:shrink-0">
                      {cover ? (
                        <img src={cover} alt={b.listings?.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <MapPin className="h-10 w-10 text-primary/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          b.status === "confirmed" ? "bg-primary/10 text-primary" :
                          b.status === "cancelled" ? "bg-muted text-muted-foreground" :
                          "bg-accent text-accent-foreground"
                        }`}>{b.status}</span>
                        <h3 className="mt-2 font-display text-xl">{b.listings?.title}</h3>
                        <p className="text-sm text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />{b.listings?.location}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" /> {b.check_in} → {b.check_out}
                        </span>
                        <span className="font-semibold">${Number(b.total_price).toFixed(2)}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
