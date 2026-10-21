import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout, authImagePreload } from "@/components/AuthLayout";
import { getHeroImages } from "@/lib/hero-images.functions";
import { PasswordInput } from "@/components/PasswordInput";
import { FieldError } from "@/components/FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { loginSchema, fieldErrors, friendlyError } from "@/lib/validation";

export const Route = createFileRoute("/auth/login")({
  loader: async () => ({ image: (await getHeroImages())[0] }),
  head: ({ loaderData }) => ({ links: authImagePreload(loaderData?.image), meta: [{ title: "Log in - BEITAK" }, { name: "description", content: "Log in to BEITAK to manage your stays in Lebanon." }, { property: "og:title", content: "Log in - BEITAK" }, { property: "og:description", content: "Log in to BEITAK to manage your stays in Lebanon." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { image } = Route.useLoaderData();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setSubmitting(false);
    if (error) {
      const msg = friendlyError(error, "Incorrect email or password.");
      toast.error(msg);
      setErrors({ _: msg });
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/" });
  };

  return (
    <AuthLayout image={image} headline="Home is closer than you think" subtitle="Guesthouses, villas & chalets across Lebanon. Reserve in minutes on WhatsApp.">
      <h1 className="font-display text-[48px] leading-none tracking-normal md:text-[60px]">Welcome back</h1>
      <p className="mt-3 text-sm text-muted-foreground">Log in to continue.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <div>
          <Label htmlFor="email" className="mb-2">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} required />
          <FieldError message={errors.email} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link to="/auth/forgot-password" className="text-[13px] font-medium text-primary hover:underline">Forgot password?</Link>
          </div>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} required />
          <FieldError message={errors.password} />
        </div>
        <FieldError message={errors._} />
        <Button type="submit" className="auth-submit w-full" disabled={submitting}>{submitting ? "Signing in…" : "Log in"}</Button>
      </form>
      <div className="my-7 flex items-center gap-4 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" /><span>New to BEITAK?</span><span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" className="auth-outline w-full bg-background font-semibold" asChild><Link to="/auth/signup">Create an account</Link></Button>
    </AuthLayout>
  );
}
