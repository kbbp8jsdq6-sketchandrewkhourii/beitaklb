import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Info, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, authImagePreload } from "@/components/AuthLayout";
import { getHeroImages } from "@/lib/hero-images.functions";
import { PasswordInput } from "@/components/PasswordInput";
import { FieldError } from "@/components/FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { signupSchema, fieldErrors, friendlyError } from "@/lib/validation";
import { SIGNUP_RESEND_COOLDOWN_SECONDS } from "@/lib/signup-confirmation";

export const Route = createFileRoute("/auth/signup")({
  loader: async () => ({ image: (await getHeroImages())[0] }),
  head: ({ loaderData }) => ({ links: authImagePreload(loaderData?.image), meta: [{ title: "Sign up - BEITAK" }, { name: "description", content: "Create your BEITAK account to save and book stays across Lebanon." }, { property: "og:title", content: "Sign up - BEITAK" }, { property: "og:description", content: "Create your BEITAK account to save and book stays across Lebanon." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: SignupPage,
});

function SignupPage() {
  const { image } = Route.useLoaderData();
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
    return (
    <AuthLayout image={image} headline={step === "details" ? "Find your perfect stay in Lebanon" : "Almost there"} subtitle={step === "details" ? "Guesthouses, villas & chalets across Lebanon. Reserve in minutes on WhatsApp." : "One last step to find your next stay."}>
      {step === "details" ? (
        <>
          <h1 className="font-display text-[48px] leading-none tracking-normal md:text-[60px]">Create your account</h1>
          <p className="mt-3 text-sm text-muted-foreground">Start hosting or booking across Lebanon.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div>
              <Label htmlFor="name" className="mb-2">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} aria-invalid={!!errors.fullName} placeholder="Layla Khoury" />
              <FieldError message={errors.fullName} />
            </div>
            <div>
              <Label htmlFor="email" className="mb-2">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} placeholder="you@example.com" />
              <FieldError message={errors.email} />
            </div>
            <div>
              <Label htmlFor="password" className="mb-2">Password</Label>
              <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} placeholder="At least 8 characters with a number" />
              <FieldError message={errors.password} />
              <p className="mt-2 text-xs text-muted-foreground">Use at least 8 characters, including a number.</p>
            </div>
            <FieldError message={errors._} />
            <Button type="submit" className="auth-submit w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : "Create account"}
            </Button>
          </form>
          <p className="mt-7 text-center text-sm text-muted-foreground">Already have an account?{" "}<Link to="/auth/login" className="font-bold text-primary hover:underline">Log in</Link></p>
        </>
      ) : (
        <>
          <div className="auth-mail-tile mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-2xl text-primary"><Mail className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" /></div>
          <h1 className="font-display text-[48px] leading-none tracking-normal md:text-[60px]">Check your email</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">We sent a confirmation link to <span className="break-all font-semibold text-foreground">{email}</span>. Click the link in the email to confirm your account, then you'll be signed in.</p>
          <div className="my-6 flex items-start gap-3 rounded-xl bg-muted p-4 text-sm leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>Can't find it? Check your spam or promotions folder. The email comes from Beitak.lb.</p>
          </div>
          <Button type="button" variant="outline" className="auth-outline w-full whitespace-normal px-2 text-sm" onClick={handleResend} disabled={resending || resendIn > 0}>
            {resending ? "Sending…" : resendIn > 0 ? `Resend confirmation email (${resendIn}s)` : "Resend confirmation email"}
          </Button>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Wrong address?{" "}<Button type="button" variant="link" onClick={() => { setStep("details"); setErrors({}); }} className="h-auto p-0 font-bold text-primary">Use a different email</Button>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
