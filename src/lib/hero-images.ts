export const HERO_SIZES = "100vw";

export function heroImageUrl(base: string, width: number) {
  try {
    const url = new URL(base);
    if (url.pathname.includes("/storage/v1/object/public/hero/")) {
      url.pathname = url.pathname.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
      url.searchParams.set("width", String(width));
      url.searchParams.set("quality", "75");
      return url.toString();
    }
    if (url.hostname === "images.unsplash.com") {
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", "75");
      return url.toString();
    }
  } catch { /* Keep existing non-transformable URLs. */ }
  return base;
}

export function heroImageProps(base: string) {
  return {
    src: heroImageUrl(base, 1280),
    srcSet: [480, 768, 1280, 1920].map((width) => `${heroImageUrl(base, width)} ${width}w`).join(", "),
    sizes: HERO_SIZES,
  };
}