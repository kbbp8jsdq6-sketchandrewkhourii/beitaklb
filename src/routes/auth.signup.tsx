import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import authLogoBlack from "@/assets/beitak-logo-auth-black.png";
import { AuthBackground } from "@/components/AuthBackground";
import { PasswordInput } from "@/components/PasswordInput";
import { FieldError } from "@/components/FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { signupSchema, fieldErrors, friendlyError } from "@/lib/validation";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({ meta: [{ title: "Sign up — BEITAK" }, { name: "description", content: "Create your BEITAK account to save and book stays across Lebanon." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const parsed = signupSchema.safeParse({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: parsed.data.fullName },
      },
    });
    setSubmitting(false);
    if (error) {
      const msg = friendlyError(error, "We couldn't create your account. Please try again.");
      toast.error(msg);
      setErrors({ _: msg });
      return;
    }
    const needsConfirmation = !data.session || !data.user?.email_confirmed_at;
    if (needsConfirmation) {
      await supabase.auth.signOut();
      setSentTo(parsed.data.email);
      toast.success("Account created — please verify your email.");
      return;
    }
    toast.success("Welcome to BEITAK!");
    navigate({ to: "/" });
  };

  const handleResend = async () => {
    if (!sentTo) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: sentTo,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setResending(false);
    if (error) toast.error(friendlyError(error));
    else toast.success("Verification email resent.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/">
            <img
              src={authLogoBlack}
              alt="BEITAK — Home is closer than you think"
              width={240}
              height={160}
              decoding="async"
              className="w-[240px] h-auto object-contain"
            />
          </Link>
        </div>
        <div className="rounded-3xl border border-border bg-white p-8 shadow-2xl ring-1 ring-black/5">
          {sentTo ? (
            <div className="text-center">
              <h1 className="font-display text-3xl text-foreground">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a verification link to{" "}
                <span className="font-semibold text-foreground">{sentTo}</span>. Click the link to
                activate your account before logging in.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Didn't get it? Check your spam folder.
              </p>
              <Button
                onClick={handleResend}
                disabled={resending}
                variant="outline"
                className="mt-5 w-full"
              >
                {resending ? "Sending…" : "Resend verification email"}
              </Button>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already verified?{" "}
                <Link to="/auth/login" className="font-semibold text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl text-foreground">Create your account</h1>
              <p className="mt-1 text-sm text-muted-foreground">Start hosting or booking across Lebanon.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    aria-invalid={!!errors.fullName}
                    placeholder="Layla Khoury"
                  />
                  <FieldError message={errors.fullName} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    placeholder="you@example.com"
                  />
                  <FieldError message={errors.email} />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    placeholder="At least 8 characters with a number"
                  />
                  <FieldError message={errors.password} />
                </div>
                <FieldError message={errors._} />
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Creating…" : "Create account"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/auth/login" className="font-semibold text-primary hover:underline">Log in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
