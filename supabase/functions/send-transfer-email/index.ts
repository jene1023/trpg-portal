// Supabase Edge Function: send-transfer-email
// Called from the transfer form to send a confirmation email to the recipient.
// Required env vars: RESEND_API_KEY

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";

  const body = await req.json();
  const { to_email, token, character_id, accept_url } = body as {
    to_email: string;
    token: string;
    character_id: string;
    accept_url: string;
  };

  if (!to_email || !token || !accept_url) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!resendApiKey) {
    return new Response(JSON.stringify({ status: "skipped_no_api_key" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const html = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#e2d9c8;background:#1a1714;padding:32px;border-radius:8px;">
  <h2 style="color:#c9a84c;font-size:18px;margin:0 0 16px;">CoCポータル — キャラクター譲渡のご確認</h2>
  <p style="font-size:14px;line-height:1.7;margin:0 0 16px;">
    別のユーザーからキャラクターの譲渡リクエストが届いています。<br>
    下のボタンをクリックして承認または拒否してください。
  </p>
  <p style="margin:0 0 24px;">
    <a href="${accept_url}"
       style="display:inline-block;background:#c9a84c;color:#1a1714;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;">
      譲渡を確認する →
    </a>
  </p>
  <p style="font-size:12px;color:#888;margin:0;">
    このメールに心当たりがない場合は無視してください。リンクの有効期限は7日間です。
  </p>
</div>
`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "CoC Portal <noreply@resend.dev>",
      to: [to_email],
      subject: "【CoCポータル】キャラクター譲渡のご確認",
      html,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    return new Response(JSON.stringify({ error: errBody }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ status: "sent" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
