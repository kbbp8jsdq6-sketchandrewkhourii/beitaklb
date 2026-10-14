# Remove Feedback and separate Google review links

## 1. Remove Feedback and hardcoded reviews
- Remove Feedback from the hamburger menu and from both desktop and mobile admin navigation. Check for any other navigation links and remove them if found.
- Remove the admin Feedback page and its management controls. Redirect its old `/admin/feedback` address to the admin overview.
- Replace the public `/feedback` and `/profile/$slug` pages with redirect-only routes sending visitors to the homepage. Their feedback forms, review cards and reviewer profiles will no longer exist.
- Delete the hardcoded static reviews file and remove its imports so those reviews cannot appear anywhere.
- Remove `/feedback` from the sitemap.
- Leave the real account `/profile` page, listing reviews, Google Reviews administration, and all other pages unchanged.
- Keep every feedback table, row and existing database policy untouched. No feedback data is deleted.

## 2. Separate viewing reviews from writing one
- Add **Google reviews page link** to the Google reviews area in admin site settings.
- Pre-fill and save the initial value as:
  `https://search.google.com/local/reviews?placeid=ChIJpZvkjVn7IRURulJ9PjQiON4`
- Make the homepage **See all reviews** button read that saved setting and open it in a new tab.
- If the setting is empty or only whitespace, hide that button. Clearing and saving it must remain empty rather than restoring the initial value.
- Accept an empty value or a valid HTTPS URL; reject unsafe or malformed links before saving.
- Keep the **Write a Google review** button, QR code, and QR link exactly as they are, using `https://g.page/r/CbpSfT40IjjeEBM/review`.
- Preserve the reviews section's layout, styling, animations, rating and review cards.

## Technical details
- Retain the old public route filenames as lightweight TanStack redirects, using permanent redirects for `/feedback` and `/profile/$slug`. This preserves old deep links and refreshes without hosting rewrite files or editing the generated route tree.
- The reviewer `/profile/$slug` route currently reads only the static review file; it is separate from the real `/profile` account page.
- Add one nullable text column, `google_reviews_page_link`, to `site_settings`, and populate the existing settings row with the supplied URL in the same migration. No new table or feedback-data change is needed.
- Extend the existing public Google reviews read function and shared query data with the saved link; use the existing admin settings Save and cache refresh behavior.
- Update project rules during implementation to reflect removal of static reviews and the separate view/write destinations.

## Verification
- Confirm Feedback is absent from the public menu and desktop/mobile admin navigation.
- Open and refresh old `/feedback` and reviewer profile URLs directly; verify they reach the homepage, not an error page. Verify the retired admin address reaches the overview.
- Confirm no static review file, imports or hardcoded reviewer cards remain, and the sitemap excludes `/feedback`.
- Record feedback row count before and after implementation to confirm stored data remains intact.
- Sign in to admin settings, verify the pre-filled URL, save a changed link, and confirm the homepage button uses it.
- Clear and save the link, confirm the button disappears, then restore the supplied URL.
- Confirm the write-review button and QR code still point to the original write-review URL.
- Check desktop/mobile displays and the current build for errors.

Nothing else on the site changes.