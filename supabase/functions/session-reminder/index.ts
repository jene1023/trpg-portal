// Supabase Edge Function: session-reminder
// Triggered daily by pg_cron to send email reminders for sessions scheduled for tomorrow.
// Set up with: SELECT cron.schedule('session-reminder', '0 0 * * *', $$SELECT net.http_post(url := ...) $$);
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const now = new Date();
  const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  const { data: scenarios, error } = await supabase
    .from("scenarios")
    .select("id, title, next_session_at, remind_email")
    .eq("remind_enabled", true)
    .gte("next_session_at", in23h)
    .lte("next_session_at", in25h);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: { scenario_id: string; status: string; error?: string }[] = [];

  for (const scenario of scenarios ?? []) {
    if (!scenario.remind_email) continue;

    const sessionDate = new Date(scenario.next_session_at).toLocaleString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tokyo",
    });

    const portalUrl = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
    const scenarioLink = `https://${portalUrl}/scenarios/${scenario.id}`;

    const html = `
<h2 style="color:#8b6914;">CoCポータル セッション前日リマインド</h2>
<p>明日はセッションの予定日です。</p>
<table style="border-collapse:collapse;margin:16px 0;">
  <tr><td style="padding:4px 12px 4px 0;color:#888;font-size:14px;">シナリオ</td><td style="padding:4px 0;font-size:14px;">${scenario.title}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888;font-size:14px;">予定日時</td><td style="padding:4px 0;font-size:14px;">${sessionDate}</td></tr>
</table>
<p><a href="${scenarioLink}" style="color:#8b6914;">CoCポータルでシナリオを確認する →</a></p>
<hr style="border:none;border-top:1px solid #333;margin:24px 0;">
<p style="font-size:12px;color:#888;">このメールはCoCポータルのリマインド設定により自動送信されました。リマインドを停止するにはポータルのシナリオ設定ページでリマインドを無効にしてください。</p>
`;

    if (!resendApiKey) {
      results.push({ scenario_id: scenario.id, status: "skipped_no_api_key" });
      continue;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CoC Portal <noreply@resend.dev>",
        to: [scenario.remind_email],
        subject: `【リマインド】明日「${scenario.title}」のセッションがあります`,
        html,
      }),
    });

    if (res.ok) {
      results.push({ scenario_id: scenario.id, status: "sent" });
    } else {
      const body = await res.text();
      results.push({ scenario_id: scenario.id, status: "failed", error: body });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
