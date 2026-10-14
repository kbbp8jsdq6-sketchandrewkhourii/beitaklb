# Structured listing details

## What changes

### 1. New optional listing details
Each listing gets: minimum guests, bedroom detail line, bathroom detail line, kitchens, living area (m²), check-in time, check-out time, stay types (overnight / day use / events), extra guest fee weekday and weekend, extra fee "after X guests", other rates (name + price list), highlights (short list), amenity detail lines, "About this place" (max 1000 chars), and the original pasted description (admin only, never shown publicly). All existing fields stay as they are, and the 1000 character limit on the description stays.

### 2. Admin add and edit forms (the existing ones, no new tabs)
- At the top: a "Paste the owner's description" box and a "Convert description" button.
- The AI follows your rules: it only pulls out what is written, removes emojis, sales lines and "Contact Beitak.lb" lines, writes About as 2-3 clean sentences, matches amenities to the site's existing amenity list (WiFi / Wi-Fi / wifi become one) and puts anything unusual in as a custom amenity, and fixes obvious typos but lists them.
- Every field is always shown, even when empty. After converting, a short yellow list shows what is missing or unclear, and those fields get a yellow border.
- Nothing is saved until you click Save.

### 3. Public listing page
- Order: photo grid, title, location, highlight pills (red tint), four spec cards (guests, bedrooms + detail, bathrooms + detail, living area), About this place, "What this place offers" in two columns (red icon + detail line), and a price card on the right: From $X / night, weekday and weekend price, extra guest fee and after how many guests, Other rates, check-in and check-out, and the existing Reserve via WhatsApp button.
- Same site style: Bebas Neue headings, Inter text, Beitak red, black, white, 12px corners.
- Anything empty is hidden completely, and so is any section with nothing in it. No "0 bedrooms" and no "$0 / night".
- Listings that have not been converted yet keep showing their current description like they do now.

### 4. Converting the 180 existing listings in one go
- Done once by me in the background, with no new admin page or button.
- Each listing's original description is kept in the admin-only field.
- Max guests, bedrooms, bathrooms, prices, district and location are never changed. If the description says something different, the existing value stays and the listing gets flagged.
- A listing is flagged when, after converting, it is missing key details (guests, bedrooms, bathrooms, check-in/check-out, prices), when it has a conflict like the one above, or when its description looks cut off at 1000 characters (2 listings are right at that limit today).
- On the admin Listings page: a "Needs details" badge with the reasons (for example "Missing: check-in time · Price conflict: weekday") and a simple "Flagged only" filter. The badge goes away when you save the listing with those details filled in or confirmed.

Nothing else on the site changes.

## Assumptions to correct if wrong
- "Confirmed" means: saving the edit form clears the flag for any conflict you leave as it is (saving counts as approval). The missing-field flags clear once those fields have a value.
- The converted About paragraph is used for the page's search-engine description once it exists. Otherwise the current description is used, as it is today.
- Stay type allows more than one choice (for example overnight + events).

## Technical details
- Database: add nullable columns to `listings` (min_guests, bedroom_details, bathroom_details, kitchens, living_area_m2, check_in_time, check_out_time, stay_types text[], extra_guest_fee_weekday/weekend, extra_guest_after, other_rates jsonb, highlights text[], amenity_details jsonb, about text, original_description text, needs_details_reasons text[], details_converted_at). Original description stays out of public reads: the public listing query lists only safe columns, and a column-level revoke on original_description for anon/authenticated is paired with admin reads through a server function. Existing policies are unchanged.
- AI: an admin-only server function (requireSupabaseAuth + has_role admin check) calls the Lovable AI Gateway with tool-calling structured output and the shared amenity list. It returns fields, warnings and typos. The amenity list moves into one shared module used by both forms.
- Backfill: a one-off sandbox script runs the same prompt over all 180 listings, writes only the new columns plus reasons, and never touches existing fields. A run log is kept in /tmp.
- Public page: `listing.$id.tsx` render section rebuilt with conditional blocks. If `details_converted_at` is null, the current description block is used as a fallback.
- Admin Listings page: select needs_details_reasons, add the badge and a filter toggle. The edit form recomputes reasons on save.
- Verification: typecheck, convert one listing in the form, desktop 1280 and mobile 390 checks of a full and a sparse listing, and the flag badge and filter.
