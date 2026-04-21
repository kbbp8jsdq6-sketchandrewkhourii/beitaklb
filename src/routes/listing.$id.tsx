import { createFileRoute, Link, useNavigate, useParams, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { MapPin, Star, Users, BedDouble, Bath, Calendar as CalIcon, Check, ChevronLeft, ChevronRight, Instagram } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "96181160435";
const INSTAGRAM_URL = "https://instagram.com/beitak.lb";

export const Route = createFileRoute("/listing/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Listing — BEITAK` }, { name: "description", content: `Stay in Lebanon — listing ${params.id}` }],
  }),
  component: ListingPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="font-display text-4xl">Listing not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">← Back home</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-destructive">{error.message}</p>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">← Home</Link>
      </div>
    </div>
  ),
});

async function fetchListing(id: string) {
  const { data, error } = await supabase
    .from("listings")
    .select(`
      id, title, description, location, price_per_night, max_guests, bedrooms, bathrooms,
      amenities, available_from, available_to, host_id, created_at,
      listing_photos(id, photo_url, display_order),
      profiles:host_id (full_name, avatar_url),
      reviews(id, rating, comment, created_at, reviewer_id, profiles:reviewer_id(full_name))
    `)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound();
  return data;
}

function ListingPage() {
  const { id } = useParams({ from: "/listing/$id" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => fetchListing(id),
  });

  const [photoIdx, setPhotoIdx] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [booking, setBooking] = useState(false);

  const photos = useMemo(
    () => (listing?.listing_photos ?? []).slice().sort((a, b) => a.display_order - b.display_order),
    [listing]
  );

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.round(ms / 86_400_000));
  }, [checkIn, checkOut]);

  const total = nights * Number(listing?.price_per_night ?? 0);

  const avgRating = useMemo(() => {
    if (!listing?.reviews?.length) return null;
    return listing.reviews.reduce((s, r) => s + r.rating, 0) / listing.reviews.length;
  }, [listing]);

  const handleBook = async () => {
    if (!user) {
      toast.error("Please log in to book");
      navigate({ to: "/auth/login" });
      return;
    }
    if (!checkIn || !checkOut || nights <= 0) {
      toast.error("Pick valid check-in and check-out dates");
      return;
    }
    if (!listing) return;
    if (guests > listing.max_guests) {
      toast.error(`Max ${listing.max_guests} guests`);
      return;
    }
    setBooking(true);
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        listing_id: listing.id,
        guest_id: user.id,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        total_price: total,
        status: "confirmed",
      })
      .select("id")
      .single();
    setBooking(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/bookings/$id/confirmation", params: { id: data.id } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="aspect-[16/9] w-full animate-pulse rounded-3xl bg-muted" />
        </div>
      </div>
    );
  }
  if (!listing) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <article className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header>
          <h1 className="font-display text-4xl text-foreground sm:text-5xl">{listing.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {avgRating != null && (
              <span className="flex items-center gap-1 text-foreground">
                <Star className="h-4 w-4 fill-foreground" /> {avgRating.toFixed(1)} · {listing.reviews?.length ?? 0} reviews
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {listing.location}, Lebanon
            </span>
          </div>
        </header>

        {/* Photos */}
        <div className="mt-6 overflow-hidden rounded-3xl bg-muted">
          {photos.length > 0 ? (
            <div className="relative aspect-[16/9]">
              <img src={photos[photoIdx].photo_url} alt={listing.title} className="h-full w-full object-cover" />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIdx((p) => (p - 1 + photos.length) % photos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-md hover:bg-background"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setPhotoIdx((p) => (p + 1) % photos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-md hover:bg-background"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-background/80 px-3 py-1 text-xs">
                    {photoIdx + 1} / {photos.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center">
              <MapPin className="h-16 w-16 text-primary/30" />
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          {/* Left */}
          <section>
            <div className="border-b border-border pb-6">
              <h2 className="font-display text-2xl">
                Hosted by {listing.profiles?.full_name ?? "Host"}
              </h2>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Up to {listing.max_guests} guests</span>
                <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4" /> {listing.bedrooms} bedroom{listing.bedrooms === 1 ? "" : "s"}</span>
                <span className="flex items-center gap-1.5"><Bath className="h-4 w-4" /> {Number(listing.bathrooms)} bath</span>
              </div>
            </div>
            <div className="border-b border-border py-6">
              <h3 className="font-display text-xl">About this place</h3>
              <p className="mt-3 whitespace-pre-line text-foreground/80">{listing.description}</p>
            </div>
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="border-b border-border py-6">
                <h3 className="font-display text-xl">Amenities</h3>
                <ul className="mt-3 grid grid-cols-2 gap-2">
                  {listing.amenities.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {listing.available_from && (
              <div className="py-6">
                <h3 className="font-display text-xl">Availability</h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalIcon className="h-4 w-4" />
                  {listing.available_from} → {listing.available_to ?? "ongoing"}
                </p>
              </div>
            )}

            {/* Reviews */}
            {listing.reviews && listing.reviews.length > 0 && (
              <div className="border-t border-border py-6">
                <h3 className="font-display text-xl">Reviews</h3>
                <ul className="mt-4 space-y-4">
                  {listing.reviews.map((r) => (
                    <li key={r.id} className="rounded-2xl border border-border p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{r.profiles?.full_name ?? "Guest"}</p>
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-foreground" /> {r.rating}
                        </span>
                      </div>
                      {r.comment && <p className="mt-2 text-sm text-foreground/80">{r.comment}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Booking card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-lg">
              <p className="text-2xl">
                <span className="font-semibold">${Number(listing.price_per_night).toFixed(0)}</span>
                <span className="text-base text-muted-foreground"> / night</span>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border px-3 py-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider">Check in</label>
                  <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
                </div>
                <div className="rounded-xl border border-border px-3 py-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider">Check out</label>
                  <input type="date" value={checkOut} min={checkIn || undefined} onChange={(e) => setCheckOut(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
                </div>
              </div>
              <div className="mt-2 rounded-xl border border-border px-3 py-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider">Guests</label>
                <input
                  type="number"
                  min={1}
                  max={listing.max_guests}
                  value={guests}
                  onChange={(e) => setGuests(Math.min(listing.max_guests, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              <Button onClick={handleBook} className="mt-4 w-full" size="lg" disabled={booking}>
                {booking ? "Booking…" : "Reserve"}
              </Button>
              {nights > 0 && (
                <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between"><span>${Number(listing.price_per_night).toFixed(0)} × {nights} night{nights === 1 ? "" : "s"}</span><span>${total.toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Total (USD)</span><span>${total.toFixed(2)}</span></div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}
