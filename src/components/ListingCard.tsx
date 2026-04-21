import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";

export interface ListingCardData {
  id: string;
  title: string;
  location: string;
  price_per_night: number;
  cover?: string | null;
  rating?: number | null;
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  return (
    <Link
      to="/listing/$id"
      params={{ id: listing.id }}
      className="group block"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
        {listing.cover ? (
          <img
            src={listing.cover}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-accent">
            <MapPin className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 backdrop-blur">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            {listing.location.split(" (")[0]}
          </span>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-sans text-base font-semibold text-foreground">
            {listing.title}
          </h3>
          {listing.rating != null && (
            <div className="flex shrink-0 items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-foreground text-foreground" />
              <span>{listing.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {listing.location}
        </p>
        <p className="mt-1.5 text-sm">
          <span className="font-semibold text-foreground">${listing.price_per_night.toFixed(0)}</span>
          <span className="text-muted-foreground"> / night</span>
        </p>
      </div>
    </Link>
  );
}
