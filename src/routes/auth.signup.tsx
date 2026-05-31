import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
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
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"details" | "otp">("details");
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
    setStep("otp");
    setResendIn(30);
    toast.success("We sent a 6-digit code to your email.");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || code.length !== 6) return;
    setSubmitting(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "signup",
    });
    setSubmitting(false);
    if (error) {
      toast.error(friendlyError(error, "Invalid or expired code."));
      return;
    }
    toast.success("Welcome to BEITAK!");
    navigate({ to: "/" });
  };

  const handleResend = async () => {
    if (resendIn > 0 || resending) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });
    setResending(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    setResendIn(30);
    toast.success("Code resent.");
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
              <h1 className="font-display text-3xl text-foreground">Enter your code</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>.
              </p>
              <form onSubmit={handleVerify} className="mt-6 space-y-5" noValidate>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button type="submit" className="w-full" disabled={submitting || code.length !== 6}>
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying…</> : "Verify & continue"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleResend}
                  disabled={resending || resendIn > 0}
                >
                  {resending ? "Sending…" : resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep("details"); setCode(""); }}
                  className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  Back to details
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
