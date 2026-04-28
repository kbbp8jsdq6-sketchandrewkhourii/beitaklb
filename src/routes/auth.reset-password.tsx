import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { AuthBackground } from "@/components/AuthBackground";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { resetPasswordSchema, fieldErrors, friendlyError } from "@/lib/validation";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — BEITAK" },
      { name: "description", content: "Set a new password for your BEITAK account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    const { resetPasswordSchema, fieldErrors, friendlyError } = await import("@/lib/validation");
    const parsed = resetPasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      const f = fieldErrors(parsed.error);
      setError(f.password || f.confirm || "Please check the form");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setSubmitting(false);
    if (error) {
      setError(friendlyError(error, "We couldn't update your password. Please try again."));
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate({ to: "/auth/login" }), 2000);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/"><Logo size="xl" /></Link>
        </div>
        <div className="rounded-3xl border border-border bg-white p-8 shadow-2xl ring-1 ring-black/5">
          <h1 className="font-display text-3xl text-foreground">Create a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a strong password you'll remember.
          </p>

          {success ? (
            <div
              className="mt-6 rounded-xl border p-4 text-sm"
              style={{ borderColor: "rgba(230,48,48,0.25)", background: "rgba(230,48,48,0.06)", color: "#111" }}
            >
              Password updated! Redirecting you to login…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="password">New password</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm new password</Label>
                <PasswordInput
                  id="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                />
              </div>
              {error && (
                <p className="text-sm font-medium" style={{ color: "#E63030" }}>{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
