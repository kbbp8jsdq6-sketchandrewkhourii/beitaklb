import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  email: string;
  redirectTo: string;
}

const buildEmailHtml = (resetLink: string) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:40px 32px;">
      <h1 style="font-size:24px;font-weight:700;margin:0 0 16px;color:#111;">Reset your password 🔑</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 12px;">
        No worries, it happens to the best of us! Click below to set a new password for your Beitak account:
      </p>
      <div style="margin:28px 0;">
        <a href="${resetLink}" style="display:inline-block;background:#E63030;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;">
          Reset my password 🏠
        </a>
      </div>
      <p style="font-size:13px;line-height:1.6;color:#777;margin:24px 0 0;">
        If you didn't request this, you can safely ignore this email.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
      <p style="font-size:12px;color:#999;margin:0;text-align:center;">
        © 2026 Beitak — Home is closer than you think 🏠<br/>
        @beitak.lb
      </p>
    </div>
  </body>
</html>
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo } = (await req.json()) as RequestBody;

    if (!email || !redirectTo) {
      return new Response(JSON.stringify({ error: "Missing email or redirectTo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Generate the recovery link (does NOT send an email)
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (error || !data?.properties?.action_link) {
      console.error("generateLink failed", error);
      // Always respond with success to avoid leaking which emails exist
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resetLink = data.properties.action_link;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Beitak <onboarding@resend.dev>",
        to: [email],
        subject: "Reset your Beitak password 🔑",
        html: buildEmailHtml(resetLink),
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend send failed", emailRes.status, errText);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-reset-email error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
