# Homepage hero: immediate first image, no black gaps

## Confirmed findings
- The homepage loader already fetches hero images in ascending display order, passes them to the slideshow, and adds a first-image preload. Both preview and published HTML contain that image.
- However, the first image is rendered with `opacity: 0`, so it needs the slideshow animation to become visible. Its container is near-black.
- The desktop hero is mounted only after a browser screen-width check and a lazy component load, rather than appearing in the initial page HTML.
- Slide changes run every 4.5 seconds without checking whether the next image has loaded or decoded. Next-image downloading starts immediately, competing with the first image.
- Stored hero images currently use their original URLs on every screen. A test of the first image's storage resizing endpoint succeeded.

## Planned fix
1. **Make the initial hero complete in the page HTML.** Keep loading the ordered image list with the homepage, but use a public, read-only server function for that read. Pass the result directly to the slideshow and remove its separate browser image-list query. Render the desktop hero during server rendering too, using CSS for desktop/mobile visibility instead of waiting for scripts.
2. **Show the first image without animation or scripts.** Render the first image fully visible from the start, with eager loading and high fetch priority. Add a matching responsive preload in the homepage head so the browser downloads the same image size that it will display, not an extra original-sized copy.
3. **Use smaller downloads on phones.** Add shared hero-only URL helpers for storage-resized image candidates, using sensible phone and desktop widths, responsive `srcSet`, and matching `sizes`. Keep the saved image URLs and admin uploads unchanged. Fall back to the original URL if a resized image fails.
4. **Load later images quietly and only transition when ready.** Wait until the first image has loaded and decoded before requesting other slides at low priority, starting with the next slide. Retain the current image until the requested next image is decoded, then crossfade. Keep the existing 4.5-second interval and 1.2-second fade; if a download takes longer, hold the current image rather than fade to black. Apply the same readiness checks to dots and swipes, and skip failed slides without removing the visible one.
5. **Provide an immediate non-black fallback.** Use a soft, muted warm-neutral background while the first image is loading or if it fails, with the existing logo and hero text readable. Adjust only the loading-state treatment of dark overlays and initial text visibility as necessary. Restore the current image overlays and appearance once the image is ready.

An uncached photograph cannot be guaranteed to download instantly on a slow connection. The guarantee is that the first paint contains the image or the non-black fallback with visible hero text, never an empty black hero.

## Verification
- Check raw server-rendered HTML for the lowest-order image, matching responsive preload, eager loading, high priority, and no initial zero opacity. Check desktop and mobile with JavaScript disabled.
- Test logged-out desktop and a phone-sized viewport with a cold cache and throttled slow-mobile network. Capture the loading state, first image, and subsequent transitions.
- Verify subsequent hero downloads begin only after the first image is ready, mobile selects a smaller image, and hidden desktop/mobile layouts do not cause duplicate large downloads.
- Delay and fail later image requests; test automatic slides, dots, and swipes. Confirm the previous image stays visible and no transition exposes a black background.
- Confirm hero wording, buttons, layout, timing, desktop effects, and the admin Hero Images page remain unchanged. Check preview errors before completing.

## Technical scope and boundaries
Changes are limited to `src/routes/index.tsx`, `src/components/HeroSlideshow.tsx`, `src/components/home/DesktopHero.tsx`, new hero-specific read/URL helpers, and loading-state style tokens in `src/styles.css` if needed. Record the hero-loading architecture rule in `AGENTS.md`.

Use the existing loader-data pattern rather than refactoring the site's global query setup. Preserve unrelated homepage data loading, all other sections, database contents and permissions, and admin upload/reordering behavior. No new photos, database changes, or image-processing server are needed. Do not publish without separate approval.