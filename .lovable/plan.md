# Homepage search redesign and share-image revert

## Scope
Change only the homepage search section's presentation and its two share-image tags. Keep every existing search control, option, default, interaction, and result rule, along with all hero loading improvements.

## 1. Restore the homepage share image
- Set both `og:image` and `twitter:image` back to exactly `https://beitaklb.com/og-image.jpg`.
- Leave the first hero image's preload, responsive sizes, server-loaded image list, eager loading, background loading, fallback, and safe slideshow transitions untouched.
- **Availability note:** that exact image address currently returns HTTP 404. Restore the requested tags without inventing or replacing the image; flag that sharing previews may remain unavailable until the original image is restored. These tag changes reach the live site on the next publish, not merely in preview.

## 2. Restyle the search card
Keep the surrounding section, light pink dotted background, existing introductory heading, and the line above the card: “Search by keyword, city, size, amenities and budget - all in one place.”

Use one white card with approximately 22px corners and a soft shadow. Apply Bebas Neue to the card heading and budget range, Inter to controls and supporting text, and the existing Beitak red, near-black, white, and grey palette. The requested tiles are bordered groups inside that single card, not additional shadowed cards.

### Desktop
- Left-align “Find your perfect guesthouse.” at approximately 44px.
- **Row 1:** one approximately 60px-high bordered bar with 14px corners. Put the existing keyword input and red search icon on the left; put All Cities, a red pin, and chevron in an approximately 220px-wide right portion, separated by a thin divider. Place a matching-height red SEARCH button with a search icon beside the bar.
- **Row 2:** Bedrooms, Bathrooms, and Guests tiles in approximately 40% / 40% / 20% proportions. Use small uppercase grey labels with red icons. Bedrooms and Bathrooms each have one light-grey connected segmented track with `Any 1 2 3 4 5 5+`; the selected segment is red with white text. Guests uses the same track styling with white minus/plus buttons and the count between them.
- **Row 3:** Amenities at approximately one third width and Budget per night at two thirds. Amenities shows “Any amenities” when empty, selected amenities otherwise, and a red Choose action with a chevron opening the existing picker. Keep individual selected-amenity removal available without nested buttons or losing selections.
- Show the selected budget range prominently in Bebas Neue. Keep the same dual-handle slider, with a red track and white round handles bordered red. Below it, place $0 at the left, the existing drag instruction in the middle, and $2,000 at the right.
- Center “Not sure where to start?” and the red underlined “Ask our AI assistant” action with its chat icon below the controls.

### Mobile
- Use the available width with safe outer spacing and a roughly 36px heading.
- Stack keyword and All Cities inside one bordered box with a horizontal divider.
- Follow with full-width Bedrooms, then full-width Bathrooms; fit every segment without horizontal scrolling.
- Put Guests and Amenities in equal-width tiles on the same row.
- Follow with full-width Budget, then a full-width red SEARCH button, then the AI assistant line.
- Allow long selected amenities and the budget instruction to wrap cleanly without pushing controls outside the card.

## Preserve behavior exactly
- Retain keyword placeholder, live suggestions, suggestion links, city choices, all amenity choices, picker Clear/Done actions, removable selected amenities, and the AI assistant action.
- Keep current defaults: Any bedrooms/bathrooms, 1 guest, no amenities, All Cities, and $0–$2,000.
- Keep guest limits of 1–20, budget steps of $50, existing slider constraints, Enter-to-search, and button-to-search.
- Keep all search URL parameters and result filtering unchanged, including the existing handling of 5 and 5+.
- Do not change the search results page, data access, admin pages, hero appearance, slideshow timing, or other homepage sections.

## Technical approach
- Update homepage share tags in `src/routes/index.tsx` only; keep hero-related imports, loader data, and preload intact.
- Make presentation changes within `src/components/FindYourUnit.tsx`, reusing its existing state, handlers, suggestion query, amenities picker, and slider calculations.
- Use a single set of controls and responsive layout placement, rather than duplicating desktop/mobile forms with separate state.
- Use existing design-system buttons and semantic theme tokens. Add only narrowly scoped search-surface/shadow tokens in `src/styles.css` if needed; do not alter global component styles.

## Verification before completion
- Capture representative searches before styling, including their URL parameters and returned listing IDs, then repeat them afterward against the same data.
- Check desktop and mobile layouts, including a narrow phone: all segments visible, no clipped labels, overlapping controls, or horizontal overflow.
- Exercise keyword suggestions and links, city selection, every bedroom/bathroom option including 5+, guest limits, amenity select/remove/Clear/Done, both budget handles, Enter submission, SEARCH, and the AI assistant action.
- Run at least one combined-filter search through the actual results page on both desktop and mobile, and compare with the baseline.
- Confirm both homepage share tags contain the exact requested URL, while the first hero image still appears in the initial HTML with its high-priority preload and the non-black loading fallback remains intact.
- Check preview build/runtime signals. Do not publish without approval.