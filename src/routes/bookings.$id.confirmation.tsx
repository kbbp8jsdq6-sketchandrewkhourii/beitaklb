import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Check, Calendar, MapPin, Users } from "lucide-react";

export const Route = createFileRoute("/bookings/$id/confirmation")({
  head: () => ({ meta: [{ title: "Booking confirmed — BEITAK" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { id } = useParams({ from: "/bookings/$id/confirmation" });
  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id, check_in, check_out, guests, total_price, status,
          listings(id, title, location, listing_photos(photo_url, display_order))
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  if (!booking) return <div className="flex min-h-screen items-center justify-center">Booking not found</div>;

  const cover = (booking.listings?.listing_photos ?? []).slice().sort((a, b) => a.display_order - b.display_order)[0]?.photo_url;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-4xl text-foreground">Booking confirmed!</h1>
          <p className="mt-1 text-muted-foreground">Your stay in Lebanon is locked in. مبروك!</p>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border text-left">
            {cover && <img src={cover} alt="" className="aspect-[16/9] w-full object-cover" />}
            <div className="p-5">
              <h2 className="font-display text-2xl">{booking.listings?.title}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{booking.listings?.location}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-muted p-3">
                  <p className="flex items-center gap-1 text-xs uppercase text-muted-foreground"><Calendar className="h-3 w-3" />Check in</p>
                  <p className="mt-1 font-semibold">{booking.check_in}</p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="flex items-center gap-1 text-xs uppercase text-muted-foreground"><Calendar className="h-3 w-3" />Check out</p>
                  <p className="mt-1 font-semibold">{booking.check_out}</p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="flex items-center gap-1 text-xs uppercase text-muted-foreground"><Users className="h-3 w-3" />Guests</p>
                  <p className="mt-1 font-semibold">{booking.guests}</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3">
                  <p className="text-xs uppercase text-primary">Total paid</p>
                  <p className="mt-1 font-display text-xl text-primary">${Number(booking.total_price).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button asChild variant="outline" className="flex-1"><Link to="/">Keep exploring</Link></Button>
            <Button asChild className="flex-1"><Link to="/bookings">My trips</Link></Button>
          </div>
        </div>
      </main>
    </div>
  );
}
