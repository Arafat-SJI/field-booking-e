const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const { email, name, appName, loginUrl } = await req.json();

    if (!email || !name) {
      throw new Error("Missing required fields: email, name");
    }

    const brand = appName ?? "Your App";
    const loginLink = loginUrl ?? "/login";

    const welcomeHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0a2540,#0d3158);padding:32px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:22px;margin:0;">Welcome to ${brand}</h1>
    </div>
    <div style="padding:32px 24px;">
      <p style="font-size:16px;color:#1a1a2e;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 24px;">
        Thanks for signing up. Once your email is verified, you can log in and start using ${brand}.
      </p>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${loginLink}" style="display:inline-block;background:#2563eb;color:#fff;font-weight:600;font-size:15px;padding:12px 32px;border-radius:8px;text-decoration:none;">Go to Login</a>
      </div>
      <p style="font-size:14px;color:#666;margin:0;">Need help? Reply to this email.</p>
    </div>
    <div style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="font-size:12px;color:#94a3b8;margin:0;">Â© ${new Date().getFullYear()} ${brand}</p>
    </div>
  </div>
</body>
</html>`;

    const welcomeRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM") ?? "App <onboarding@resend.dev>",
        to: [email],
        subject: `Welcome to ${brand}`,
        html: welcomeHtml,
      }),
    });

    if (!welcomeRes.ok) {
      const err = await welcomeRes.text();
      console.error("Welcome email failed:", err);
      throw new Error(err);
    }

    return new Response(
      JSON.stringify({ message: "Welcome email sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error sending emails:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
