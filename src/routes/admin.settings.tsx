import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Admin — BEITAK" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSettingsPage,
});

interface SettingsForm {
  business_email: string;
  business_phone: string;
  business_whatsapp: string;
  business_instagram: string;
  maintenance_mode: boolean;
  terms_text: string;
}

const EMPTY: SettingsForm = {
  business_email: "",
  business_phone: "",
  business_whatsapp: "",
  business_instagram: "",
  maintenance_mode: false,
  terms_text: "",
};

function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const q = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (q.data) {
      setForm({
        business_email: q.data.business_email ?? "",
        business_phone: q.data.business_phone ?? "",
        business_whatsapp: q.data.business_whatsapp ?? "",
        business_instagram: q.data.business_instagram ?? "",
        maintenance_mode: q.data.maintenance_mode,
        terms_text: q.data.terms_text ?? "",
      });
    }
  }, [q.data]);

  const update = (patch: Partial<SettingsForm>) =>
    setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update(form)
      .eq("id", 1);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Settings saved");
      q.refetch();
    }
  };

  const toggleMaintenance = async (val: boolean) => {
    update({ maintenance_mode: val });
    const { error } = await supabase
      .from("site_settings")
      .update({ maintenance_mode: val })
      .eq("id", 1);
    if (error) {
      toast.error(error.message);
      update({ maintenance_mode: !val });
    } else {
      toast.success(val ? "Maintenance mode ON" : "Site is live");
      q.refetch();
    }
  };

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Business contact info, maintenance mode, and Terms & Conditions.
        </p>
      </header>

      {/* Maintenance mode */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <h2 className="font-semibold text-foreground">Maintenance mode</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              When ON, regular visitors see a maintenance screen. Admins still
              see the full site.
            </p>
          </div>
          <Switch
            checked={form.maintenance_mode}
            onCheckedChange={toggleMaintenance}
          />
        </div>
      </section>

      {/* Business contact info */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Business contact info</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shown on the public Contact page and footer.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.business_email}
              onChange={(e) => update({ business_email: e.target.value })}
              className="mt-1"
              maxLength={255}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.business_phone}
              onChange={(e) => update({ business_phone: e.target.value })}
              className="mt-1"
              maxLength={50}
            />
          </div>
          <div>
            <Label htmlFor="wa">WhatsApp</Label>
            <Input
              id="wa"
              value={form.business_whatsapp}
              onChange={(e) => update({ business_whatsapp: e.target.value })}
              className="mt-1"
              maxLength={50}
            />
          </div>
          <div>
            <Label htmlFor="ig">Instagram</Label>
            <Input
              id="ig"
              value={form.business_instagram}
              onChange={(e) => update({ business_instagram: e.target.value })}
              className="mt-1"
              maxLength={100}
            />
          </div>
        </div>
      </section>

      {/* Terms */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Terms & Conditions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Plain text. Use blank lines to separate sections. Section titles are
          shown when a line starts with a number followed by a period (e.g.
          "1. Platform role").
        </p>
        <Textarea
          value={form.terms_text}
          onChange={(e) => update({ terms_text: e.target.value })}
          className="mt-3 min-h-72 font-mono text-sm"
          maxLength={20000}
        />
      </section>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          <Save className="mr-1 h-4 w-4" />
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
