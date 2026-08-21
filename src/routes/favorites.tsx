import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "My Favorites - BEITAK" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user, loading } = useAuth();

  const { data: favorites = [], isLoading } = useQuery<ListingCardData[]>({
    queryKey: ["favorite-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select(
          "listing_id, listings(id, title, location, price_per_night, price_weekday, price_weekend, amenities, max_guests, listing_photos(photo_url, display_order))",
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .filter((row) => row.listings)
        .map((row) => {
          const l = row.listings!;
          const photos = (l.listing_photos ?? []).slice().sort((a, b) => a.display_order - b.display_order);
          return {
            id: l.id,
            title: l.title,
            location: l.location,
            price_per_night: Number(l.price_per_night),
            price_weekday: Number(l.price_weekday),
            price_weekend: Number(l.price_weekend),
            amenities: l.amenities ?? [],
            max_guests: l.max_guests ?? null,
            cover: photos[0]?.photo_url ?? null,
            photos: photos.map((p) => p.photo_url),
          };
        });
    },
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">Loading…</div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto mt-20 max-w-md px-4 text-center">
          <Heart className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 font-display text-3xl">Sign in to view favorites</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an account or log in to save listings you love.
          </p>
          <Link
            to="/auth/login"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground transition hover:bg-primary/90"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Heart className="h-7 w-7 fill-primary text-primary" />
          <h1 className="font-display text-4xl text-foreground sm:text-5xl">My favorites</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Listings you've saved, available across all your devices.
        </p>

        {isLoading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-muted/40 p-12 text-center">
            <p className="font-display text-2xl text-foreground">No favorites yet 🏠</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Start exploring and save the listings you love
            </p>
            <Link
              to="/search"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground transition hover:bg-primary/90"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
