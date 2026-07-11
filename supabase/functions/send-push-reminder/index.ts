// Supabase Edge Function: send-push-reminder
// Sends Web Push notifications for sessions scheduled the day before (at 19:00 JST)
// and 2 hours before the session time.
//
// Schedule with pg_cron:
//   SELECT cron.schedule('push-reminder-daily',  '0 10 * * *', $$SELECT net.http_post(url := '<FUNCTION_URL>', headers := '{"Authorization":"Bearer <ANON_KEY>"}')$$);
//   SELECT cron.schedule('push-reminder-hourly', '0 *  * * *', $$SELECT net.http_post(url := '<FUNCTION_URL>?window=2h', headers := '{"Authorization":"Bearer <ANON_KEY>"}')$$);
//
// Required env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimal VAPID JWT signer using WebCrypto (no npm dependency)
async function signVapidJwt(audience: string, subject: string, privateKeyB64u: string): Promise<string> {
  const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({ aud: audience, exp: now + 43200, sub: subject })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signingInput = `${header}.${payload}`;

  const rawKey = Uint8Array.from(atob(privateKeyB64u.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    rawKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${signingInput}.${sig}`;
}

async function sendWebPush(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidEmail: string,
): Promise<{ ok: boolean; status: number }> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.hostname}`;
  const jwt = await signVapidJwt(audience, `mailto:${vapidEmail}`, vapidPrivateKey);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt},k=${vapidPublicKey}`,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
    },
    body: new TextEncoder().encode(payload),
  });

  return { ok: res.ok, status: res.status };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
  const vapidEmail = Deno.env.get("VAPID_EMAIL") ?? "admin@example.com";

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return new Response(JSON.stringify({ error: "Missing VAPID env vars" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const window = url.searchParams.get("window") === "2h" ? "2h" : "day-before";

  const db = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date();

  // Determine the target session time window
  let rangeStart: Date;
  let rangeEnd: Date;
  let notificationTitle: string;
  let notificationBody: (scenarioTitle: string, sessionDate: string) => string;

  if (window === "2h") {
    // Sessions starting in 1.5h – 2.5h
    rangeStart = new Date(now.getTime() + 90 * 60 * 1000);
    rangeEnd = new Date(now.getTime() + 150 * 60 * 1000);
    notificationTitle = "⏰ セッション開始まであと2時間";
    notificationBody = (title, date) => `「${title}」は ${date} に開始します。準備はよいですか？`;
  } else {
    // Sessions starting in 23h – 25h (day before at ~19:00 JST = 10:00 UTC)
    rangeStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    rangeEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    notificationTitle = "📅 明日セッションがあります";
    notificationBody = (title, date) => `「${title}」は ${date} に開催されます。`;
  }

  // Fetch scenarios in range that have remind enabled
  const { data: scenarios, error: scenarioErr } = await db
    .from("scenarios")
    .select("id, title, next_session_at")
    .eq("remind_enabled", true)
    .gte("next_session_at", rangeStart.toISOString())
    .lte("next_session_at", rangeEnd.toISOString());

  if (scenarioErr) {
    return new Response(JSON.stringify({ error: scenarioErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: { scenario_id: string; pushed: number; failed: number }[] = [];

  for (const scenario of scenarios ?? []) {
    const sessionDate = new Date(scenario.next_session_at).toLocaleString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tokyo",
    });

    // Fetch all push subscriptions for participants of this scenario
    const { data: participants } = await db
      .from("scenario_participants")
      .select("player_id")
      .eq("scenario_id", scenario.id)
      .not("player_id", "is", null);

    const playerIds = (participants ?? []).map((p: { player_id: string }) => p.player_id);
    if (!playerIds.length) {
      results.push({ scenario_id: scenario.id, pushed: 0, failed: 0 });
      continue;
    }

    const { data: subscriptions } = await db
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .in("user_id", playerIds);

    const payload = JSON.stringify({
      title: notificationTitle,
      body: notificationBody(scenario.title, sessionDate),
      url: `/scenarios/${scenario.id}`,
    });

    let pushed = 0;
    let failed = 0;

    for (const sub of subscriptions ?? []) {
      const result = await sendWebPush(
        sub.endpoint,
        sub.p256dh,
        sub.auth,
        payload,
        vapidPublicKey,
        vapidPrivateKey,
        vapidEmail,
      );

      if (result.ok) {
        pushed++;
      } else {
        failed++;
        // Remove expired/invalid subscriptions (HTTP 410 Gone)
        if (result.status === 410) {
          await db.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }

    results.push({ scenario_id: scenario.id, pushed, failed });
  }

  return new Response(JSON.stringify({ window, processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
