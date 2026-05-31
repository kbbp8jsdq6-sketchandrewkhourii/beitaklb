import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import authLogoBlack from "@/assets/beitak-logo-auth-black.png";
import { AuthBackground } from "@/components/AuthBackground";
import { FieldError } from "@/components/FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Log in — BEITAK" }, { name: "description", content: "Log in to BEITAK to manage your stays in Lebanon." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendCode = async (addr: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { shouldCreateUser: true },
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    setResendIn(30);
    return true;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const addr = email.trim();
    if (!addr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }
    setErrors({});
    setSubmitting(true);
    const ok = await sendCode(addr);
    setSubmitting(false);
    if (ok) {
      setStep("otp");
      toast.success("We sent a verification code to your email.");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || code.length !== 6) return;
    setSubmitting(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "email",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/" });
  };

  const handleResend = async () => {
    if (resendIn > 0 || resending) return;
    setResending(true);
    const ok = await sendCode(email.trim());
    setResending(false);
    if (ok) toast.success("Code resent.");
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
          {step === "email" ? (
            <>
              <h1 className="font-display text-3xl text-foreground">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">Log in to continue.</p>
              <form onSubmit={handleSendCode} className="mt-6 space-y-4" noValidate>
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
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</> : "Send Code"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                New here?{" "}
                <Link to="/auth/signup" className="font-semibold text-primary hover:underline">Create an account</Link>
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
                  onClick={() => { setStep("email"); setCode(""); }}
                  className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  Use a different email
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
