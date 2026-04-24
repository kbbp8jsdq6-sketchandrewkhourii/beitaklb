import { createFileRoute, Link, useParams, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, Users, BedDouble, Bath, Check, Instagram, DollarSign, Loader2, Coffee, Heart } from "lucide-react";
import { Header } from "@/components/Header";
import { Lightbox } from "@/components/Lightbox";
import { WhatsAppReserveModal } from "@/components/WhatsAppReserveModal";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import { buildListingWhatsAppHrefSync, buildListingWhatsAppHref } from "@/lib/whatsapp";
import { toast } from "sonner";

const INSTAGRAM_URL = "https://instagram.com/beitak.lb";

export const Route = createFileRoute("/listing/$id")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("listings")
      .select("title, description, location, listing_photos(photo_url, display_order)")
      .eq("id", params.id)
      .maybeSingle();
    if (!data) return { meta: null as null | { title: string; description: string; location: string; image: string | null } };
    const photos = (data.listing_photos ?? []).slice().sort((a, b) => a.display_order - b.display_order);
    return {
      meta: {
        title: data.title,
        description: data.description,
        location: data.location,
        image: photos[0]?.photo_url ?? null,
      },
    };
  },
  head: ({ loaderData }) => {
    const m = loaderData?.meta;
    if (!m) {
      return { meta: [{ title: "Listing — BEITAK" }, { name: "description", content: "Stay in Lebanon with BEITAK." }] };
    }
    const title = `${m.title} in ${m.location} — BEITAK`.slice(0, 60);
    const desc = (m.description ?? `Stay at ${m.title} in ${m.location}.`).slice(0, 160);
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(m.image ? [{ property: "og:image", content: m.image }, { name: "twitter:image", content: m.image }] : []),
      ],
    };
  },
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
      id, title, description, location, price_per_night, price_weekday, price_weekend, max_guests, bedrooms, bathrooms,
      amenities, category, host_id, created_at,
      listing_photos(id, photo_url, display_order),
      profiles:host_id (full_name, avatar_url, phone),
      reviews(id, rating, comment, created_at, reviewer_id, profiles:reviewer_id(full_name))
    `)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound();
  return data;
}

const CATEGORY_LABEL: Record<"villa" | "cabin" | "apartment", string> = {
  villa: "Villa",
  cabin: "Cabin",
  apartment: "Apartment",
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.11 17.32c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.1 4.5.71.31 1.27.5 1.7.64.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM16.02 5.33c-5.92 0-10.73 4.81-10.74 10.72 0 1.89.49 3.74 1.43 5.36L5.2 26.67l5.42-1.42a10.7 10.7 0 0 0 5.39 1.45h.01c5.92 0 10.73-4.81 10.74-10.72a10.66 10.66 0 0 0-3.14-7.59 10.66 10.66 0 0 0-7.59-3.16z" />
    </svg>
  );
}

function ListingPage() {
  const { id } = useParams({ from: "/listing/$id" });
  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => fetchListing(id),
  });

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [waLoading, setWaLoading] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [waHref, setWaHref] = useState<string | null>(null);

  // Record a listing view (fire-and-forget). RLS allows anon + authenticated insert.
  useEffect(() => {
    if (!id) return;
    supabase
      .from("listing_views")
      .insert({ listing_id: id })
      .then(() => {});
  }, [id]);

  const { favoriteIds, toggleFavorite } = useFavorites();
  const isFav = listing ? favoriteIds.has(listing.id) : false;
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (listing) toggleFavorite(listing.id);
  };

  const photos = useMemo(
    () => (listing?.listing_photos ?? []).slice().sort((a, b) => a.display_order - b.display_order),
    [listing]
  );

  const avgRating = useMemo(() => {
    if (!listing?.reviews?.length) return null;
    return listing.reviews.reduce((s, r) => s + r.rating, 0) / listing.reviews.length;
  }, [listing]);

  const openReserveModal = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!listing) return;
    const hostPhone = (listing.profiles as { phone?: string | null } | null)?.phone?.trim();
    if (!hostPhone) {
      toast.error(
        "This host hasn't added a phone number yet. Please contact support to book this stay.",
      );
      return;
    }
    const url = typeof window !== "undefined" ? window.location.href : "";
    const payload = {
      title: listing.title,
      location: `${listing.location}, Lebanon`,
      priceWeekday: Number(listing.price_weekday),
      priceWeekend: Number(listing.price_weekend),
      url,
    };
    // Build href SYNCHRONOUSLY first so the <a> in the modal has a working
    // link immediately (no popup blocker risk).
    const syncHref = buildListingWhatsAppHrefSync(payload, hostPhone);
    setWaHref(syncHref);
    setShowReserveModal(true);

    // Try to upgrade to a shortened URL in the background (non-blocking).
    // If TinyURL fails or is slow, the sync href above still works.
    setWaLoading(true);
    buildListingWhatsAppHref(payload, hostPhone)
      .then((shortHref) => {
        if (shortHref && shortHref !== syncHref) setWaHref(shortHref);
      })
      .catch(() => {
        // Silently keep the sync href.
      })
      .finally(() => setWaLoading(false));
  };

  const closeReserveModal = () => {
    setShowReserveModal(false);
    setWaHref(null);
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

  const heroPhoto = photos[0];
  const restPhotos = photos.slice(1);

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <Header />

      {/* Hero gallery */}
      <section className="relative w-full">
        {heroPhoto ? (
          <button
            onClick={() => setLightboxIdx(0)}
            className="group relative block h-[50vh] w-full overflow-hidden bg-muted"
            aria-label="Open photo viewer"
          >
            <img
              src={heroPhoto.photo_url}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            {photos.length > 1 && (
              <span className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                View all {photos.length} photos
              </span>
            )}
          </button>
        ) : (
          <div className="flex h-[50vh] w-full items-center justify-center bg-muted">
            <MapPin className="h-16 w-16 text-primary/30" />
          </div>
        )}
        {/* Floating favorite button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
          aria-pressed={isFav}
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-background/95 text-foreground shadow-lg backdrop-blur transition active:scale-90 hover:bg-background"
        >
          <motion.span
            key={isFav ? "fav-on" : "fav-off"}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 14 }}
            className="inline-flex"
          >
            <Heart
              className={`h-6 w-6 transition-colors ${
                isFav ? "fill-primary text-primary" : "text-foreground"
              }`}
            />
          </motion.span>
        </button>

        {/* Thumbnail grid */}
        {restPhotos.length > 0 && (
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {restPhotos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setLightboxIdx(i + 1)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted"
                >
                  <img
                    src={p.photo_url}
                    alt={`${listing.title} — photo ${i + 2}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Body */}
      <article className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-4xl text-foreground sm:text-5xl">{listing.title}</h1>
              {listing.category && (
                <span className="mt-2 inline-flex items-center rounded-full bg-foreground px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-background">
                  {CATEGORY_LABEL[listing.category as "villa" | "cabin" | "apartment"]}
                </span>
              )}
            </div>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow @beitak.lb on Instagram"
              className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-[#E1306C]"
            >
              <Instagram className="h-5 w-5" />
            </a>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {avgRating != null && (
              <span className="flex items-center gap-1 text-foreground">
                <Star className="h-4 w-4 fill-foreground" /> {avgRating.toFixed(1)} · {listing.reviews?.length ?? 0} reviews
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" /> {listing.location}, Lebanon
            </span>
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-primary" /> Weekday ${Number(listing.price_weekday).toFixed(0)} · Weekend ${Number(listing.price_weekend).toFixed(0)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" /> Up to {listing.max_guests} guests
            </span>
          </div>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          {/* Left */}
          <section>
            <div className="border-b border-border pb-6">
              <h2 className="font-display text-2xl">
                Hosted by {listing.profiles?.full_name ?? "Host"}
              </h2>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {listing.max_guests} guests</span>
                <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4" /> {listing.bedrooms} bedroom{listing.bedrooms === 1 ? "" : "s"}</span>
                <span className="flex items-center gap-1.5"><Bath className="h-4 w-4" /> {Number(listing.bathrooms)} bath</span>
              </div>
            </div>
            <div className="border-b border-border py-6">
              <h3 className="font-display text-xl">About this place</h3>
              <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-foreground/80">{listing.description}</p>
            </div>
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="border-b border-border py-6">
                <h3 className="font-display text-xl">Amenities</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {listing.amenities.map((a) => {
                    const isBreakfast = a.toLowerCase() === "breakfast included";
                    return (
                      <li
                        key={a}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
                          isBreakfast
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground"
                        }`}
                      >
                        {isBreakfast ? <Coffee className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5 text-primary" />} {a}
                      </li>
                    );
                  })}
                </ul>
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

          {/* Booking card (desktop) */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-lg">
              <div className="space-y-1">
                <p className="flex items-baseline justify-between text-sm">
                  <span className="text-muted-foreground">Weekday</span>
                  <span><span className="font-semibold text-foreground">${Number(listing.price_weekday).toFixed(0)}</span><span className="text-xs text-muted-foreground"> / night</span></span>
                </p>
                <p className="flex items-baseline justify-between text-sm">
                  <span className="text-muted-foreground">Weekend</span>
                  <span><span className="font-semibold text-foreground">${Number(listing.price_weekend).toFixed(0)}</span><span className="text-xs text-muted-foreground"> / night</span></span>
                </p>
              </div>
              <div className="mt-4 flex items-center gap-3 border-y border-border py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {(listing.profiles?.full_name ?? "H").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Hosted by</p>
                  <p className="text-sm font-semibold">{listing.profiles?.full_name ?? "Host"}</p>
                </div>
              </div>
              <a
                href="#"
                onClick={openReserveModal}
                aria-disabled={waLoading}
                className="mt-4 inline-flex w-full animate-[pulse-soft_2.4s_ease-in-out_infinite] items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-base font-bold uppercase tracking-wide text-primary-foreground shadow-[0_0_0_0_rgba(230,48,48,0.5)] transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-70"
              >
                {waLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating link...
                  </>
                ) : (
                  <>
                    <WhatsAppIcon className="h-5 w-5" />
                    Reserve via WhatsApp
                  </>
                )}
              </a>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Instant reply · No booking fees
              </p>
            </div>
          </aside>
        </div>
      </article>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold leading-tight">
              <span className="text-muted-foreground">From </span>
              ${Math.min(Number(listing.price_weekday), Number(listing.price_weekend)).toFixed(0)}
              <span className="text-xs font-normal text-muted-foreground"> / night</span>
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Up to {listing.max_guests} guests</p>
          </div>
          <a
            href="#"
            onClick={openReserveModal}
            aria-disabled={waLoading}
            className="inline-flex flex-1 animate-[pulse-soft_2.4s_ease-in-out_infinite] items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Reserve
          </a>
        </div>
      </div>

      <WhatsAppReserveModal
        open={showReserveModal}
        loading={waLoading}
        onConfirm={handleConfirmReserve}
        onCancel={() => setShowReserveModal(false)}
      />

      {lightboxIdx !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIdx}
          alt={listing.title}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx((i) => (i === null ? 0 : (i - 1 + photos.length) % photos.length))}
          onNext={() => setLightboxIdx((i) => (i === null ? 0 : (i + 1) % photos.length))}
        />
      )}
    </div>
  );
}
