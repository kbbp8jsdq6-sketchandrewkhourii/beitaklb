import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { User as UserIcon, Trash2, MapPin } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — BEITAK" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const { data: myListings = [], refetch } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, location, price_per_night, is_active, listing_photos(photo_url, display_order)")
        .eq("host_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user && !hydrated,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, bio, phone")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setFullName(data.full_name ?? "");
        setBio(data.bio ?? "");
        setPhone(data.phone ?? "");
      }
      setHydrated(true);
      return data;
    },
  });

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, bio, phone })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); refetch(); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto mt-20 max-w-md text-center">
          <h1 className="font-display text-3xl">Log in to view your profile</h1>
          <Button asChild className="mt-4"><Link to="/auth/login">Log in</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <UserIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="font-display text-3xl">{fullName || "Your profile"}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">Personal info</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fn">Full name</Label>
              <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ph">Phone</Label>
              <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+961…" />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </div>
          <Button onClick={saveProfile} className="mt-4" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">My listings</h2>
          </div>
          {myListings.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">You don't have any listings. Listings on BEITAK are managed by our team — message us on WhatsApp to get yours added.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {myListings.map((l) => {
                const cover = (l.listing_photos ?? []).slice().sort((a, b) => a.display_order - b.display_order)[0]?.photo_url;
                return (
                  <li key={l.id} className="flex items-center gap-4 rounded-xl border border-border p-3">
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {cover ? (
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><MapPin className="h-5 w-5 text-primary/30" /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to="/listing/$id" params={{ id: l.id }} className="line-clamp-1 font-semibold hover:text-primary">
                        {l.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{l.location} · ${Number(l.price_per_night).toFixed(0)}/night</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteListing(l.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
