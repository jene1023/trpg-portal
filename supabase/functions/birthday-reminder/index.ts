// Supabase Edge Function: birthday-reminder
// Sends Web Push notifications to PLs when one of their characters has a birthday today.
//
// Schedule with pg_cron (runs at 07:00 JST = 22:00 UTC previous day):
//   SELECT cron.schedule('birthday-reminder', '0 22 * * *', $$SELECT net.http_post(url := '<FUNCTION_URL>', headers := '{"Authorization":"Bearer <ANON_KEY>"}')$$);
//
// Required env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  const db = createClient(supabaseUrl, supabaseServiceKey);

  // Today's date as MM-DD in JST
  const nowJst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const month = String(nowJst.getMonth() + 1).padStart(2, "0");
  const day = String(nowJst.getDate()).padStart(2, "0");
  const todayMmDd = `${month}-${day}`;

  // Fetch all characters with a birthday set
  const { data: characters, error: charErr } = await db
    .from("characters")
    .select("id, name, birthday, user_id")
    .not("birthday", "is", null);

  if (charErr) {
    return new Response(JSON.stringify({ error: charErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Filter to those whose birthday MM-DD matches today
  type CharRow = { id: string; name: string; birthday: string; user_id: string };
  const todaysBirthdays = (characters as CharRow[]).filter((c) => {
    // birthday may be stored as YYYY-MM-DD or MM-DD
    const parts = c.birthday.split("-");
    const mmDd = parts.length >= 3
      ? `${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`
      : `${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
    return mmDd === todayMmDd;
  });

  const results: { character_id: string; character_name: string; pushed: number; failed: number }[] = [];

  for (const character of todaysBirthdays) {
    const { data: subscriptions } = await db
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", character.user_id);

    if (!subscriptions || subscriptions.length === 0) {
      results.push({ character_id: character.id, character_name: character.name, pushed: 0, failed: 0 });
      continue;
    }

    const payload = JSON.stringify({
      title: "🎂 誕生日おめでとう！",
      body: `本日は${character.name}の誕生日です！`,
      url: `/characters/${character.id}`,
    });

    let pushed = 0;
    let failed = 0;

    for (const sub of subscriptions) {
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

    results.push({ character_id: character.id, character_name: character.name, pushed, failed });
  }

  return new Response(
    JSON.stringify({ today: todayMmDd, birthday_count: todaysBirthdays.length, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
