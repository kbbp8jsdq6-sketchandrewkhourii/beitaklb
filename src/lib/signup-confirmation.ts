export const SIGNUP_RESEND_COOLDOWN_SECONDS = 60;

/** Scope the welcome to signup email links, never login or password recovery. */
export function isSignupConfirmationReturn(hash: string): boolean {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get("type") === "signup" && !!params.get("access_token") && !params.has("error");
}