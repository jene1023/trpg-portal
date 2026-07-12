import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function esc(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(text: string | null | undefined): string {
  if (!text) return "";
  return esc(text).replace(/\n/g, "<br>");
}

const STATUS_LABELS: Record<string, string> = {
  planning: "準備中",
  ongoing: "進行中",
  completed: "完了",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase が設定されていません。" }, { status: 503 });
  }

  const { id } = await params;

  const { data: scenario, error: scenarioError } = await supabase
    .from("scenarios")
    .select("*")
    .eq("id", id)
    .single();

  if (scenarioError || !scenario) {
    return NextResponse.json({ error: "シナリオが見つかりません。" }, { status: 404 });
  }

  const [
    { data: scenes },
    { data: npcs },
    { data: handouts },
  ] = await Promise.all([
    supabase
      .from("scenario_scenes")
      .select("*")
      .eq("scenario_id", id)
      .order("scene_order", { ascending: true }),
    supabase
      .from("npcs")
      .select("*")
      .eq("scenario_name", scenario.title)
      .order("name", { ascending: true }),
    supabase
      .from("handouts")
      .select("*")
      .eq("scenario_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const scenesHtml =
    (scenes ?? []).length > 0
      ? `<section>
  <h2>シーン構成</h2>
  ${(scenes ?? [])
    .map(
      (s) => `<div class="card">
    <h3>${esc(s.title)}${s.is_done ? ' <span class="badge">完了</span>' : ""}</h3>
    ${s.notes ? `<p>${nl2br(s.notes)}</p>` : ""}
  </div>`
    )
    .join("\n")}
</section>`
      : "";

  const npcsHtml =
    (npcs ?? []).length > 0
      ? `<section>
  <h2>NPC 一覧</h2>
  ${(npcs ?? [])
    .map(
      (n) => `<div class="card">
    <h3>${esc(n.name)}${n.faction ? ` <span class="sub">（${esc(n.faction)}）</span>` : ""}</h3>
    ${n.appearance ? `<p><strong>外見：</strong>${esc(n.appearance)}</p>` : ""}
    ${n.purpose ? `<p><strong>目的・役割：</strong>${esc(n.purpose)}</p>` : ""}
    ${n.speech_style ? `<p><strong>口調：</strong>${esc(n.speech_style)}</p>` : ""}
    ${n.sample_quotes ? `<p><strong>セリフ例：</strong>${nl2br(n.sample_quotes)}</p>` : ""}
    ${n.notes ? `<p><strong>メモ：</strong>${nl2br(n.notes)}</p>` : ""}
    ${
      n.hp != null || n.mp != null || n.str != null
        ? `<table class="stat-table">
      <tr>
        ${n.str != null ? `<th>STR</th>` : ""}
        ${n.con != null ? `<th>CON</th>` : ""}
        ${n.pow != null ? `<th>POW</th>` : ""}
        ${n.dex != null ? `<th>DEX</th>` : ""}
        ${n.app != null ? `<th>APP</th>` : ""}
        ${n.siz != null ? `<th>SIZ</th>` : ""}
        ${n.int_stat != null ? `<th>INT</th>` : ""}
        ${n.edu != null ? `<th>EDU</th>` : ""}
        ${n.hp != null ? `<th>HP</th>` : ""}
        ${n.mp != null ? `<th>MP</th>` : ""}
        ${n.db != null ? `<th>DB</th>` : ""}
      </tr>
      <tr>
        ${n.str != null ? `<td>${n.str}</td>` : ""}
        ${n.con != null ? `<td>${n.con}</td>` : ""}
        ${n.pow != null ? `<td>${n.pow}</td>` : ""}
        ${n.dex != null ? `<td>${n.dex}</td>` : ""}
        ${n.app != null ? `<td>${n.app}</td>` : ""}
        ${n.siz != null ? `<td>${n.siz}</td>` : ""}
        ${n.int_stat != null ? `<td>${n.int_stat}</td>` : ""}
        ${n.edu != null ? `<td>${n.edu}</td>` : ""}
        ${n.hp != null ? `<td>${n.hp}</td>` : ""}
        ${n.mp != null ? `<td>${n.mp}</td>` : ""}
        ${n.db != null ? `<td>${esc(n.db)}</td>` : ""}
      </tr>
    </table>`
        : ""
    }
  </div>`
    )
    .join("\n")}
</section>`
      : "";

  const handoutsHtml =
    (handouts ?? []).length > 0
      ? `<section>
  <h2>ハンドアウト</h2>
  ${(handouts ?? [])
    .map(
      (h) => `<div class="card${h.is_secret ? " secret" : ""}">
    <h3>${esc(h.title)}${h.is_secret ? ' <span class="badge secret-badge">秘匿</span>' : ""}${h.recipient_name ? ` <span class="sub">→ ${esc(h.recipient_name)}</span>` : ""}${h.is_distributed ? ' <span class="badge">配布済み</span>' : ""}</h3>
    ${h.content ? `<p>${nl2br(h.content)}</p>` : ""}
  </div>`
    )
    .join("\n")}
</section>`
      : "";

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(scenario.title)} — KP レジュメ</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
    font-size: 14px;
    line-height: 1.7;
    color: #1a1a1a;
    background: #fff;
    padding: 24px;
    max-width: 900px;
    margin: 0 auto;
  }
  h1 { font-size: 1.8em; border-bottom: 3px solid #1a1a1a; padding-bottom: 8px; margin-bottom: 4px; }
  h2 { font-size: 1.1em; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1px solid #999; padding-bottom: 4px; margin-bottom: 12px; margin-top: 32px; color: #333; }
  h3 { font-size: 1em; margin-bottom: 6px; }
  p { margin-bottom: 6px; }
  .meta { font-size: 0.85em; color: #555; margin-bottom: 16px; }
  .card { border: 1px solid #ccc; border-radius: 6px; padding: 12px 16px; margin-bottom: 12px; page-break-inside: avoid; }
  .card.secret { border-color: #b33; background: #fff8f8; }
  .badge { display: inline-block; font-size: 0.75em; padding: 1px 6px; border-radius: 3px; background: #eee; color: #444; margin-left: 6px; vertical-align: middle; }
  .secret-badge { background: #f8d7da; color: #721c24; }
  .sub { font-size: 0.85em; color: #666; margin-left: 6px; }
  .stat-table { border-collapse: collapse; margin-top: 8px; font-size: 0.85em; }
  .stat-table th, .stat-table td { border: 1px solid #ccc; padding: 3px 8px; text-align: center; }
  .stat-table th { background: #f0f0f0; font-weight: 600; }
  footer { margin-top: 40px; padding-top: 8px; border-top: 1px solid #ccc; font-size: 0.8em; color: #888; text-align: right; }
  @media print {
    body { padding: 0; }
    h2 { margin-top: 20px; }
    @page { size: A4; margin: 15mm; }
  }
</style>
</head>
<body>

<h1>${esc(scenario.title)}</h1>
<div class="meta">
  <span>ステータス: ${STATUS_LABELS[scenario.status] ?? esc(scenario.status)}</span>
  ${scenario.played_at ? `<span style="margin-left:16px">プレイ日: ${esc(scenario.played_at)}</span>` : ""}
  ${scenario.next_session_at ? `<span style="margin-left:16px">次回予定: ${esc(scenario.next_session_at)}</span>` : ""}
</div>

${
  scenario.synopsis
    ? `<section>
  <h2>概要</h2>
  <p>${nl2br(scenario.synopsis)}</p>
</section>`
    : ""
}

${
  scenario.gm_notes
    ? `<section>
  <h2>GM メモ</h2>
  <p>${nl2br(scenario.gm_notes)}</p>
</section>`
    : ""
}

${scenesHtml}

${npcsHtml}

${handoutsHtml}

<footer>CoC Portal — ${esc(scenario.title)} KP レジュメ</footer>

</body>
</html>`;

  const filename = `kp-resume-${id}.html`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
