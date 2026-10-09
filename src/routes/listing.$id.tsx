import { createFileRoute, Link, useParams, notFound } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, Users, BedDouble, Bath, Check, Instagram, DollarSign, Coffee, Heart } from "lucide-react";
import { Header } from "@/components/Header";
import { Lightbox } from "@/components/Lightbox";
import { PhotoSlider } from "@/components/PhotoSlider";
import { LocationPreviewMap } from "@/components/LocationPreviewMap";

import { ReserveDetailsModal } from "@/components/ReserveDetailsModal";

import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import beitakLogo from "@/assets/logo-new.png";

const INSTAGRAM_URL = "https://instagram.com/beitak.lb";

export const Route = createFileRoute("/listing/$id")({
  loader: async ({ params }) => {
    const listing = await fetchListing(params.id);
    return { listing };
  },
  head: ({ loaderData, params }) => {
    const listing = loaderData?.listing;
    if (!listing) {
      return {
        meta: [
          { title: "Listing - Beitak.lb" },
          { name: "description", content: "Stay in Lebanon with Beitak." },
          { name: "robots", content: "index, follow" },
        ],
        links: [{ rel: "canonical", href: `https://beitaklb.com/listing/${params.id}` }],
      };
    }
    const title = `${listing.title} in ${listing.location} | Beitak.lb`;
    const desc = (listing.description ?? `Stay at ${listing.title} in ${listing.location}.`).replace(/\s+/g, " ").trim().slice(0, 160);
    const url = `https://beitaklb.com/listing/${params.id}`;
    const photos = (listing.listing_photos ?? []).slice().sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order);
    const image = photos[0]?.photo_url ?? null;
    const priceWeekday = listing.price_weekday != null ? Number(listing.price_weekday) : null;
    const priceWeekend = listing.price_weekend != null ? Number(listing.price_weekend) : null;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      name: listing.title,
      description: desc,
      ...(image ? { image } : {}),
      address: {
        "@type": "PostalAddress",
        addressLocality: listing.location,
        addressCountry: "LB",
      },
      ...(priceWeekday != null && priceWeekend != null
        ? { priceRange: `$${priceWeekday} - $${priceWeekend}` }
        : {}),
      url,
    };
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "place" },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLd),
        },
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
        <p className="text-destructive">{error instanceof Error ? error.message : "Something went wrong"}</p>
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
      amenities, category, host_id, created_at, latitude, longitude,
      listing_photos(id, photo_url, display_order),
      reviews(id, rating, comment, created_at, reviewer_id)
    `)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound();

  // Fetch host + reviewers from the public view (excludes phone)
  const reviewerIds = Array.from(
    new Set((data.reviews ?? []).map((r) => r.reviewer_id).filter(Boolean) as string[]),
  );
  const profileIds = Array.from(new Set([data.host_id, ...reviewerIds].filter(Boolean) as string[]));
  let profilesById = new Map<string, { id: string; full_name: string | null; avatar_url: string | null }>();
  if (profileIds.length > 0) {
    const { data: profs } = await supabase
      .from("public_profiles")
      .select("id, full_name, avatar_url")
      .in("id", profileIds);
    profilesById = new Map((profs ?? []).filter((p): p is { id: string; full_name: string | null; avatar_url: string | null } => !!p.id).map((p) => [p.id, p]));
  }

  return {
    ...data,
    profiles: data.host_id ? profilesById.get(data.host_id) ?? null : null,
    reviews: (data.reviews ?? []).map((r) => ({
      ...r,
      profiles: r.reviewer_id ? profilesById.get(r.reviewer_id) ?? null : null,
    })),
  };
}

const CATEGORY_LABEL: Record<"villa" | "cabin" | "apartment", string> = {
  villa: "Villa",
  cabin: "Cabin",
  apartment: "Apartment",
};


function ListingPage() {
  const { id } = useParams({ from: "/listing/$id" });
  const { listing } = Route.useLoaderData();

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [reserveOpen, setReserveOpen] = useState(false);


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
    () => (listing?.listing_photos ?? []).slice().sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order),
    [listing]
  );

  const avgRating = useMemo(() => {
    if (!listing?.reviews?.length) return null;
    return listing.reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / listing.reviews.length;
  }, [listing]);

  if (!listing) return null;

  const restPhotos = photos.slice(1);
  const listingUrl = `https://beitaklb.com/listing/${id}`;


  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <Header />

      {/* Hero gallery — mobile & tablet only */}
      <section className="relative w-full lg:hidden">
        {photos.length > 0 ? (
          <PhotoSlider
            photos={photos}
            alt={listing.title}
            onPhotoClick={(i) => setLightboxIdx(i)}
            overlayChildren={
              photos.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setLightboxIdx(0)}
                  className="absolute bottom-4 left-4 z-10 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black/85 md:left-1/2 md:-translate-x-1/2 md:bottom-14"
                >
                  View all {photos.length} photos
                </button>
              ) : null
            }
          />
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
            <div className="grid grid-cols-2 gap-3">
              {restPhotos.map((p: { id: string; photo_url: string }, i: number) => (
                <button
                  key={p.id}
                  onClick={() => setLightboxIdx(i + 1)}
                  className="group relative overflow-hidden rounded-2xl bg-muted"
                >
                  <img
                    src={p.photo_url}
                    alt={`${listing.title} - photo ${i + 2}`}
                    className="h-auto w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Photo gallery — desktop only */}
      <section className="relative mx-auto hidden max-w-6xl px-4 pt-6 sm:px-6 lg:block lg:px-8">
        {/* Floating favorite button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
          aria-pressed={isFav}
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-background/95 text-foreground shadow-lg backdrop-blur transition active:scale-90 hover:bg-background sm:right-6 lg:right-8"
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

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((p: { id: string; photo_url: string }, i: number) => (
              <button
                key={p.id}
                onClick={() => setLightboxIdx(i)}
                className="group relative overflow-hidden rounded-2xl bg-muted"
              >
                <img
                  src={p.photo_url}
                  alt={`${listing.title} - photo ${i + 1}`}
                  className="h-auto w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex h-[50vh] w-full items-center justify-center rounded-2xl bg-muted">
            <MapPin className="h-16 w-16 text-primary/30" />
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
              <h2 className="flex items-center gap-2 font-display text-2xl">
                <span>Hosted by {listing.profiles?.full_name ?? "Host"}</span>
                <img
                  src={beitakLogo}
                  alt="Beitak"
                  width={60}
                  height={60}
                  loading="lazy"
                  decoding="async"
                  style={{ mixBlendMode: "multiply" }}
                  className="inline-block h-auto w-[60px] shrink-0 object-contain"
                />
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
                  {listing.amenities.map((a: string) => {
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
            {listing.latitude != null && listing.longitude != null && (
              <div className="border-b border-border py-6">
                <h3 className="font-display text-xl">Location</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Exact address shared after booking.
                </p>
                <div className="mt-4">
                  <LocationPreviewMap key={listing.id} latitude={listing.latitude} longitude={listing.longitude} className="h-[320px]" />
                </div>
              </div>
            )}
            {/* Reviews */}
            {listing.reviews && listing.reviews.length > 0 && (
              <div className="border-t border-border py-6">
                <h3 className="font-display text-xl">Reviews</h3>
                <ul className="mt-4 space-y-4">
                  {listing.reviews.map((r: { id: string; rating: number; comment: string | null; profiles?: { full_name: string | null } | null }) => (
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
              <button
                type="button"
                onClick={() => setReserveOpen(true)}
                className="mt-4 inline-flex w-full animate-[pulse-soft_2.4s_ease-in-out_infinite] items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-base font-bold uppercase tracking-wide text-primary-foreground shadow-[0_0_0_0_rgba(230,48,48,0.5)] transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-70"
              >
                <>
                  <WhatsAppIcon className="h-5 w-5" />
                  Reserve via WhatsApp
                </>
              </button>

              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>⚠️ Prices may vary on public holidays and special occasions</p>
                <p>✅ Final price is confirmed after inquiry with the host</p>
              </div>
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
          <button
            type="button"
            onClick={() => setReserveOpen(true)}
            className="inline-flex flex-1 animate-[pulse-soft_2.4s_ease-in-out_infinite] items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Reserve
          </button>

        </div>
        <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
          <p>⚠️ Prices may vary on public holidays and special occasions</p>
          <p>✅ Final price is confirmed after inquiry with the host</p>
        </div>
      </div>

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

      <ReserveDetailsModal
        open={reserveOpen}
        onCancel={() => setReserveOpen(false)}
        listingId={id}
        listingTitle={listing.title}
        listingLocation={listing.location}
        priceWeekday={listing.price_weekday != null ? Number(listing.price_weekday) : null}
        priceWeekend={listing.price_weekend != null ? Number(listing.price_weekend) : null}
        listingUrl={listingUrl}
        defaultGuests={listing.max_guests ?? 1}
      />

    </div>
  );
}
