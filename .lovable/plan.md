# Admin-managed Google reviews

## What changes
- Add **Google Reviews** to the admin menu with add, edit, delete, move up/down, star rating, optional property name, and a featured switch.
- Add optional **Google rating** and **Google review count** fields to site settings.
- Replace only the homepage reviews section with the requested heading, optional rating badge, one featured dark card, up to two white cards, and red Google review banner.
- Generate a real QR code for the supplied Google review link. Both buttons and the linked QR open that same destination in a new tab. Hide the QR box on mobile.
- Preserve the existing fonts, colors, dotted background, 12px corners, and gentle reveal animations.

## Display rules
- Start with no reviews or invented rating values. Only reviews you add appear.
- Show at most three reviews, honoring your order; use the featured review first, or the first ordered review if none is featured.
- Respect each review's actual 1 to 5 star rating rather than displaying a false five-star rating.
- Hide cards when empty and hide the rating badge unless both rating and count are provided.
- Keep the static reviews file, feedback page, and profile pages unchanged.

## Technical details
- Add a public-readable Google reviews table with admin-only writes and database-enforced single-featured behavior.
- Extend the existing settings record with nullable, validated rating and count fields, preserving current access rules.
- Use the existing admin controls and database client; supply homepage review data through a public read server function and query cache.
- Keep changes limited to review management, the related settings/menu, homepage review presentation/data, and necessary supporting files.

## Verification
- Check admin create, edit, reorder, featured switching, and delete with a real admin session if available.
- Verify public read and non-admin write restrictions.
- Check empty state and populated layouts at 1280px and 390px using temporary test data, then remove it and restore settings.
- Verify QR destination, new-tab links, and automatic build results.