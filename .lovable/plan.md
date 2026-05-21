I’ll fix the listing exit flow so opening a product from search always carries a reliable return target, not just browser history.

Plan:
1. Update every listing card link to include the current search URL as a `from`/return parameter when the card is clicked from `/search`.
2. Update the listing page route to accept that optional return URL parameter safely.
3. Update the global exit button behavior:
   - If the user is on a listing and a saved return URL exists, navigate back to that exact URL.
   - Keep all query params such as search text, district, bedrooms, amenities, etc.
   - Use `resetScroll: false` where appropriate so scroll restoration can preserve position.
   - Fall back to normal browser back, then homepage only if no return target/history exists.
4. Keep the existing design unchanged; only navigation/state behavior will change.

Technical notes:
- Router scroll restoration is already enabled in `src/router.tsx`.
- The current issue is likely that relying only on `window.history.back()` is not reliable in all entry paths, so the product link itself needs to carry the exact prior search URL.