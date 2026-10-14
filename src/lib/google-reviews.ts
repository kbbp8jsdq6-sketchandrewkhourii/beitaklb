import { queryOptions } from "@tanstack/react-query";
import { getGoogleReviews } from "@/lib/google-reviews.functions";

export const GOOGLE_REVIEW_URL = "https://g.page/r/CbpSfT40IjjeEBM/review";
export const googleReviewsOptions = queryOptions({
  queryKey: ["google-reviews"],
  queryFn: () => getGoogleReviews(),
  staleTime: 60_000,
});
export type GoogleReview = Awaited<ReturnType<typeof getGoogleReviews>>["reviews"][number];
export type GoogleReviewsData = Awaited<ReturnType<typeof getGoogleReviews>>;
