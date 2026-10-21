import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { SIGNUP_RESEND_COOLDOWN_SECONDS } from "@/lib/signup-confirmation";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({ meta: [{ title: "Sign up - BEITAK" }, { name: "description", content: "Create your BEITAK account to save and book stays across Lebanon." }, { property: "og:title", content: "Sign up - BEITAK" }, { property: "og:description", content: "Create your BEITAK account to save and book stays across Lebanon." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: SignupPage,
});

function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"details" | "confirmation">("details");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

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
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setSubmitting(false);
    if (error) {
      const msg = friendlyError(error, "We couldn't create your account. Please try again.");
      toast.error(msg);
      setErrors({ _: msg });
      return;
    }
    setEmail(parsed.data.email);
    setStep("confirmation");
    setResendIn(SIGNUP_RESEND_COOLDOWN_SECONDS);
  };

  const handleResend = async () => {
    if (resendIn > 0 || resending) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setResending(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    setResendIn(SIGNUP_RESEND_COOLDOWN_SECONDS);
    toast.success("Confirmation email resent.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/">
            <img
              src={authLogoBlack}
              alt="BEITAK - Home is closer than you think"
              width={240}
              height={160}
              decoding="async"
              className="w-[240px] h-auto object-contain"
            />
          </Link>
        </div>
        <div className="rounded-3xl border border-border bg-white p-8 shadow-2xl ring-1 ring-black/5">
          {step === "details" ? (
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
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : "Create account"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/auth/login" className="font-semibold text-primary hover:underline">Log in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl text-foreground">Check your email</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a confirmation link to <span className="break-all font-semibold text-foreground">{email}</span>. Click the link in the email to confirm your account, then you'll be signed in.
              </p>
              <div className="mt-6 space-y-5">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleResend}
                  disabled={resending || resendIn > 0}
                >
                  {resending ? "Sending…" : resendIn > 0 ? `Resend confirmation email (${resendIn}s)` : "Resend confirmation email"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => { setStep("details"); setErrors({}); }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  Use a different email
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
