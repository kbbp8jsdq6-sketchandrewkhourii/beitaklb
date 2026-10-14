import { createFileRoute, redirect } from "@tanstack/react-router";

// Retired page: preserve old deep links without rendering retired content.
export const Route = createFileRoute("/admin/feedback")({
  beforeLoad: () => {
    throw redirect({ to: "/admin", replace: true, statusCode: 301 });
  },
});
