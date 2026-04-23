import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminSidebar, AdminMobileNav } from "@/components/AdminSidebar";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — BEITAK" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminMobileNav />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
