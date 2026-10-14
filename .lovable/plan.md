# Simplify listing forms and matching public details

## 1. Automatic description on Save
- Remove the visible Description field from both admin forms.
- Generate the stored description at Save, in this order:
  1. Nonempty **About this place**, trimmed to 1000 characters.
  2. Pasted owner's description, with emojis removed and trimmed to 1000 characters.
  3. The listing's existing description, unchanged when both inputs are empty.
- Keep existing text sanitization and retain the original pasted text separately for admins.
- Use admin-specific validation that accepts short or empty generated descriptions. The current shared validation requires 20 characters; leave other forms' validation unchanged.
- For a new listing with both inputs empty and no previous description, use an empty string rather than invented copy. Verify database constraints allow this before implementation so Save cannot fail for a missing description.
- On the public page, use the saved description when About is empty, including converted listings. Keep the existing search-engine description behavior with a nonempty About taking priority.

## 2. Existing-list amenities only
- Remove the custom amenity box/button from both admin forms. Leave the existing amenity choices and amenity detail inputs.
- Update the AI instructions and output normalization to accept only amenities matching the site's existing list. Keep spelling-variant matching; skip unmatched amenities and their detail lines.
- Preserve all amenities already saved, including custom ones, during conversion and Save. Do not filter the stored amenity array down to the allowed list.
- Existing custom amenities remain visible on public listings, with their existing detail lines preserved.

## 3. Retire four optional details from use
- Remove **Minimum guests**, **Kitchens**, **Bathroom details**, and **Living area (m²)** from the shared Listing details section used by both forms.
- Remove these fields from the AI extraction instructions and output schema, and ignore them if an AI response includes them.
- Omit these four columns from add/edit save payloads so editing or converting cannot clear previously stored values.
- Stop using these four values to determine whether a listing has active structured details.
- On the public page, remove the minimum-guests line, bathroom detail line, and living-area/kitchen card. Keep only guests, bedrooms with Bedroom details, and bathrooms; adjust the card layout for three items while retaining existing empty-value hiding.
- Keep the database columns and their saved values intact. No data cleanup or backfill.

## Unchanged
Bedroom details, check-in/check-out, stay type, extra guest fees, other rates, highlights, amenity details, About, yellow warnings, Needs details flags, prices, photos, reservations, and all unrelated pages remain as they are. Existing flag computation and conflict-confirmation behavior stay unchanged.

## Technical scope
- Update the two admin forms, their shared details editor, the shared listing conversion/normalization helpers, and the matching public listing rendering and metadata fallback.
- Use a shared description-generation helper for consistent add/edit behavior, plus an admin-specific schema rather than relaxing validation everywhere.
- Keep deprecated values out of write payloads and active-detail detection; preserve legacy amenities independently of the AI's allowed-list filtering.
- No database migration is planned. Verify the description constraint before implementing the empty-new-listing case.

## Verification
- Test saving with About, source-only text with emojis, both empty on an existing listing, both empty on a new listing, short text, and text over 1000 characters.
- Verify AI conversion returns only allowed amenities and no retired fields, while warnings and conflict handling still work.
- Edit and convert a listing with saved custom amenities and retired values, then confirm those values remain unchanged in storage.
- Check add/edit forms and public listings on desktop and phone: removed controls are absent, three spec cards render correctly, and description fallback works without About.
- Confirm the current build and the signed-in admin Save flow succeed; remove any temporary test listings.