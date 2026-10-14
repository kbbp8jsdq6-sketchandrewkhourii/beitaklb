# Verify Feedback removal and Google review links

## Confirmed current state
- Feedback navigation and static-review references are absent, and the hardcoded static reviews file is gone.
- Old `/feedback` and `/profile/$slug` pages redirect to the homepage. The retired admin Feedback page redirects to the admin overview.
- Admin Settings has **Google reviews page link** beside the Google rating and count. Its saved value is your supplied Google reviews-list URL.
- **See all reviews** uses that saved value, opens in a new tab, and is hidden when it is empty.
- **Write a Google review** and the QR code still use `https://g.page/r/CbpSfT40IjjeEBM/review`.
- The feedback table still contains its stored data.

## Plan
1. Verify old public links redirect to the homepage, including after refreshing, and confirm no public or admin navigation links to retired pages.
2. Check the Settings field and confirm **See all reviews** opens the saved reviews-list destination in a new tab.
3. Verify changing and clearing the field updates only **See all reviews**, then restore your supplied URL.
4. Check the homepage Google reviews section on desktop and phone, including the unchanged write-review button and QR code.
5. Make only a narrowly scoped correction if these checks reveal a problem; otherwise leave the project unchanged.

## Technical scope
Keep redirect-only routes so old URLs remain valid. Do not delete database tables or rows, alter Google review content, or change unrelated pages or styling. No additional schema changes are planned.