import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LogoTransparent } from "@/components/LogoTransparent";
import { heroImageProps } from "@/lib/hero-images";

export const AUTH_IMAGE_SIZES = "(min-width: 768px) 50vw, 100vw";

export function authImagePreload(image: string | undefined) {
  return image ? [{ rel: "preload", as: "image", href: heroImageProps(image).src, imageSrcSet: heroImageProps(image).srcSet, imageSizes: AUTH_IMAGE_SIZES, fetchPriority: "high" as const }] : [];
}

export function AuthLayout({ image, headline, subtitle, children }: {
  image?: string;
  headline: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-screen min-h-screen bg-background text-foreground md:grid md:grid-cols-2">
      <aside className="auth-photo relative h-[250px] overflow-hidden border-l-[10px] border-primary bg-hero-fallback md:sticky md:top-0 md:h-screen" aria-label="Beitak stays in Lebanon">
        {image && <img {...heroImageProps(image)} sizes={AUTH_IMAGE_SIZES} alt="" loading="eager" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="auth-photo-overlay absolute inset-0" aria-hidden="true" />
        <Link to="/" className="absolute left-5 top-5 md:left-8 md:top-8" aria-label="Beitak homepage">
          <LogoTransparent size="hero" className="w-[160px] sm:w-[180px] md:w-[210px]" />
        </Link>
        <div className="absolute bottom-12 left-8 right-8 hidden text-primary-foreground md:block lg:bottom-16 lg:left-12 lg:right-12">
          <h2 className="font-display text-[76px] leading-[0.98] tracking-normal">{headline}</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed opacity-80">{subtitle}</p>
        </div>
      </aside>
      <section className="auth-form-panel relative -mt-7 flex min-h-[calc(100svh-222px)] items-center justify-center rounded-t-[26px] px-6 py-10 md:mt-0 md:min-h-screen md:rounded-none md:px-10 md:py-16">
        <div className="w-full min-w-0 max-w-[420px]">{children}</div>
      </section>
    </main>
  );
}