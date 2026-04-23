import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { MailCheck, RefreshCw, LogOut } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
  /** If true, also requires the user to be signed in. Defaults to true. */
  requireAuth?: boolean;
}

/**
 * Blocks rendering of children until the signed-in user has verified their
 * email. Shows a friendly notice with resend + sign-out actions otherwise.
 */
export function VerifyEmailGate({ children, requireAuth = true }: Props) {
  const { user, loading, isVerified, signOut } = useAuth();
  const [resending, setResending] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        Loading…
      </div>
    );
  }

  // Not signed in
  if (!user) {
    if (!requireAuth) return <>{children}</>;
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto mt-20 max-w-md px-4 text-center">
          <h1 className="font-display text-3xl">Please log in to continue</h1>
          <p className="mt-2 text-muted-foreground">You need an account to view this page.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link to="/auth/login">Log in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/auth/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Signed in but unverified
  if (!isVerified) {
    const handleResend = async () => {
      if (!user.email) return;
      setResending(true);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      setResending(false);
      if (error) toast.error(error.message);
      else toast.success("Verification email sent. Check your inbox.");
    };

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto mt-16 max-w-lg px-4">
          <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MailCheck className="h-8 w-8" />
            </div>
            <h1 className="mt-5 font-display text-3xl text-foreground">Verify your email</h1>
            <p className="mt-2 text-muted-foreground">
              We sent a verification link to{" "}
              <span className="font-semibold text-foreground">{user.email}</span>. Please click it
              to activate your account before using BEITAK.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Didn't get it? Check your spam folder, or resend below.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={handleResend} disabled={resending} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
                {resending ? "Sending…" : "Resend email"}
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut();
                }}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Already verified? Refresh this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
