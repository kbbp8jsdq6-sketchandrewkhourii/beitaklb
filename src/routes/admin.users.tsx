import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban, ShieldOff, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — Admin — BEITAK" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminUsersPage,
});

type Role = "admin" | "host" | "user";

function AdminUsersPage() {
  const [search, setSearch] = useState("");

  const usersQ = useQuery({
    queryKey: ["admin-users-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, phone, is_banned, created_at, user_roles(role)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Map of host user_ids inferred from listings
  const hostsQ = useQuery({
    queryKey: ["admin-users-hosts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("host_id");
      if (error) throw error;
      const set = new Set<string>();
      (data ?? []).forEach((r) => r.host_id && set.add(r.host_id));
      return set;
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return usersQ.data ?? [];
    return (usersQ.data ?? []).filter(
      (u) =>
        (u.full_name ?? "").toLowerCase().includes(term) ||
        (u.phone ?? "").toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term),
    );
  }, [usersQ.data, search]);

  const setRole = async (userId: string, newRole: Role) => {
    // Remove existing custom role rows for this user, then insert the new one.
    // (We keep "user" as the default — clearing rows removes admin/host elevation.)
    const { error: delErr } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (delErr) {
      toast.error(delErr.message);
      return;
    }
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Role set to ${newRole}`);
    usersQ.refetch();
  };

  const toggleBan = async (id: string, banned: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: !banned })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(banned ? "User unsuspended" : "User suspended");
      usersQ.refetch();
    }
  };

  const deleteUser = async (id: string) => {
    if (
      !confirm(
        "Delete this user's profile? Their account will lose access. This cannot be undone.",
      )
    )
      return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("User deleted");
      usersQ.refetch();
    }
  };

  const inferRole = (u: (typeof filtered)[number]): Role => {
    const roles = (u.user_roles ?? []).map((r) => r.role);
    if (roles.includes("admin")) return "admin";
    if (hostsQ.data?.has(u.id)) return "host";
    return "user";
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage roles, suspensions, and access.
        </p>
      </header>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card p-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search name, phone, or id…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {usersQ.data?.length ?? 0}
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const role = inferRole(u);
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3 font-medium">{u.full_name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">
                    {u.phone ?? "—"}
                  </td>
                  <td className="p-3">
                    <Select
                      value={role}
                      onValueChange={(v) => setRole(u.id, v as Role)}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Guest</SelectItem>
                        <SelectItem value="host">Host</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    {u.is_banned ? (
                      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-bold uppercase text-destructive">
                        Suspended
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Active</span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleBan(u.id, u.is_banned)}
                        title={u.is_banned ? "Unsuspend" : "Suspend"}
                      >
                        {u.is_banned ? (
                          <ShieldOff className="h-4 w-4" />
                        ) : (
                          <Ban className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteUser(u.id)}
                        className="text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
