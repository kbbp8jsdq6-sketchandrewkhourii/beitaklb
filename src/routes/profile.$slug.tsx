import { createFileRoute, redirect } from "@tanstack/react-router";

// Retired page: preserve old deep links without rendering retired content.
export const Route = createFileRoute("/profile/$slug")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true, statusCode: 301 });
  },
});
