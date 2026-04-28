import { z } from "zod";

// ---------------- Sanitizers ----------------

/** Strip <script> blocks and any HTML tags. Trim whitespace. */
export function stripHtml(input: string): string {
  return input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<\/?[a-z][\s\S]*?>/gi, "")
    .trim();
}

/** Tighter sanitizer for short single-line fields (also collapses whitespace). */
export function sanitizeLine(input: string): string {
  return stripHtml(input).replace(/\s+/g, " ").trim();
}

// ---------------- Friendly error mapping ----------------

/** Convert a raw Supabase / network error into a friendly message. */
export function friendlyError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const m = msg.toLowerCase();

  if (!msg) return fallback;
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please verify your email before signing in.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "An account with this email already exists.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("network") || m.includes("fetch"))
    return "Network issue. Check your connection and try again.";
  if (m.includes("row-level security") || m.includes("permission") || m.includes("not authorized"))
    return "You don't have permission to do that.";
  if (m.includes("password")) return "Password doesn't meet the requirements.";
  if (m.includes("invalid") && m.includes("email")) return "Please enter a valid email address.";
  return fallback;
}

// ---------------- Reusable schemas ----------------

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(255, "Email is too long")
  .regex(
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    "Please enter a valid email address",
  );

/** At least 8 characters, must contain at least one number. */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long")
  .regex(/[0-9]/, "Password must contain at least one number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(72),
});

export const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your name")
    .max(80, "Name is too long")
    .regex(/^[\p{L}'’\-\s]+$/u, "Name can only contain letters"),
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

// ---------------- Listing ----------------

const SAFE_TEXT = /^[^<>]*$/;

export const listingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be 100 characters or less")
    .regex(SAFE_TEXT, "Title can't contain HTML"),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must be 1000 characters or less"),
  location: z
    .string()
    .trim()
    .min(3, "Location must be at least 3 characters")
    .max(120, "Location is too long")
    .regex(/^[\p{L}0-9 ,.'’\-]+$/u, "Location contains invalid characters"),
  priceWeekday: z
    .number({ message: "Weekday price must be a number" })
    .min(1, "Price must be at least $1")
    .max(3000, "Price can't exceed $3000"),
  priceWeekend: z
    .number({ message: "Weekend price must be a number" })
    .min(1, "Price must be at least $1")
    .max(3000, "Price can't exceed $3000"),
});

// ---------------- Image upload ----------------

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `${file.name}: only JPG, PNG, or WEBP allowed`;
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `${file.name}: max file size is 5MB`;
  }
  return null;
}

// ---------------- Contact / Feedback ----------------

const NAME_LETTERS_ONLY = /^[\p{L}'’\-\s]+$/u;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name")
    .max(100, "Name is too long")
    .regex(NAME_LETTERS_ONLY, "Name can only contain letters"),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .max(50, "Phone is too long")
    .regex(/^[+0-9 ()\-]*$/, "Phone contains invalid characters")
    .optional()
    .or(z.literal("")),
  subject: z.string().trim().max(200, "Subject is too long").optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(500, "Message must be 500 characters or less"),
  // honeypot: must remain empty
  website: z.string().max(0, "Spam detected").optional().or(z.literal("")),
});

export const feedbackSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name")
    .max(100, "Name is too long")
    .regex(NAME_LETTERS_ONLY, "Name can only contain letters"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(500, "Message must be 500 characters or less"),
  rating: z.number().int().min(1).max(5),
  website: z.string().max(0, "Spam detected").optional().or(z.literal("")),
});

// ---------------- Helpers ----------------

/** Extract first error per field from a ZodError. */
export function fieldErrors<T>(err: z.ZodError<T>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
