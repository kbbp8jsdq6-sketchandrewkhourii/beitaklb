import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Log in — BEITAK" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/"><Logo size="xl" /></Link>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
          <h1 className="font-display text-3xl text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Log in to continue.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Log in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to BEITAK?{" "}
            <Link to="/auth/signup" className="font-semibold text-primary hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
