import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, MapPin, Snowflake } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import type { HolidayListing } from "@/lib/holiday-collection.functions";

export function HolidayCollection({ listings }: { listings: HolidayListing[] }) {
  const row = useRef<HTMLDivElement>(null);
  if (!listings.length) return null;
  const scroll = (dir: number) => {
    const el = row.current;
    if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <section className="holiday-section relative overflow-hidden" aria-labelledby="holiday-heading">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <Reveal className="flex items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              <Snowflake className="h-4 w-4" aria-hidden="true" /> New Year &amp; winter 2026–27
            </p>
            <h2 id="holiday-heading" className="mt-3 font-display text-[52px] leading-[0.95] md:text-[84px]">
              Discover our holiday collection
            </h2>
            <p className="mt-3 max-w-2xl text-sm opacity-75 md:text-base">
              <span className="md:hidden">Chalets and lodges close to the slopes, made for winter.</span>
              <span className="hidden md:inline">Chalets and lodges in Faraya, Faqra, Mzaar, Kfardebian, Zaarour, Ehden and Arez, close to the slopes and made for winter.</span>
            </p>
          </div>
          <div className="hidden shrink-0 gap-2 md:flex">
            <Button type="button" size="icon" variant="outline" className="holiday-arrow h-11 w-11 rounded-full" onClick={() => scroll(-1)} aria-label="Previous stays"><ChevronLeft className="h-5 w-5" /></Button>
            <Button type="button" size="icon" variant="outline" className="holiday-arrow h-11 w-11 rounded-full" onClick={() => scroll(1)} aria-label="Next stays"><ChevronRight className="h-5 w-5" /></Button>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div ref={row} className="holiday-row -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:gap-5 lg:-mx-8 lg:scroll-px-8 lg:px-8">
            {listings.map((l) => (
              <Link key={l.id} to="/listing/$id" params={{ id: l.id }} className="group w-[78%] shrink-0 snap-start overflow-hidden rounded-[14px] bg-card text-card-foreground md:w-[290px]">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {l.cover && <img src={l.cover} alt={l.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                  {l.location && (
                    <span className="absolute left-3 top-3 flex max-w-[85%] items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                      <span className="truncate">{l.location}</span>
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="truncate font-semibold">{l.title}</h3>
                  {(l.max_guests || l.bedrooms) && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[l.max_guests && `Up to ${l.max_guests} guests`, l.bedrooms && `${l.bedrooms} ${l.bedrooms === 1 ? "bedroom" : "bedrooms"}`].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {l.price && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      From <span className="font-display text-2xl text-primary">${l.price.toLocaleString("en-US")}</span> / night
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-center text-xs opacity-70 md:hidden">Swipe to see all {listings.length} winter stays</p>
        </Reveal>
      </div>
    </section>
  );
}
