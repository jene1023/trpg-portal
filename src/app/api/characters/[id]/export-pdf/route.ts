import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  calcDamageBonus,
  calcBuild,
  calcMov,
  half,
  fifth,
} from "@/lib/coc-calc";

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

const STATUS_LABEL: Record<string, string> = {
  alive: "生存",
  dead: "死亡",
  insane: "狂気",
  retired: "引退",
};

const STATS = [
  { key: "str" as const, label: "STR 筋力" },
  { key: "con" as const, label: "CON 体力" },
  { key: "pow" as const, label: "POW 精神力" },
  { key: "dex" as const, label: "DEX 敏捷性" },
  { key: "app" as const, label: "APP 外見" },
  { key: "siz" as const, label: "SIZ 体格" },
  { key: "int_stat" as const, label: "INT 知性" },
  { key: "edu" as const, label: "EDU 教育" },
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase が設定されていません。" }, { status: 503 });
  }

  const { id } = await params;

  const { data: char, error: charError } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .single();

  if (charError || !char) {
    return NextResponse.json({ error: "キャラクターが見つかりません。" }, { status: 404 });
  }

  const [{ data: skills }, { data: items }] = await Promise.all([
    supabase
      .from("character_skills")
      .select("*")
      .eq("character_id", id)
      .order("skill_name", { ascending: true }),
    supabase
      .from("inventory_items")
      .select("*")
      .eq("character_id", id)
      .order("item_type", { ascending: true }),
  ]);

  const db = calcDamageBonus(char.str, char.siz);
  const build = calcBuild(char.str, char.siz);
  const mov = calcMov(char.str, char.dex, char.siz);

  const weapons = (items ?? []).filter((i) => i.item_type === "weapon");
  const otherItems = (items ?? []).filter((i) => i.item_type !== "weapon");
  const occupationSkills = (skills ?? []).filter((s) => s.is_occupation);
  const otherSkills = (skills ?? []).filter((s) => !s.is_occupation);

  const statsRows = STATS.map(({ key, label }) => {
    const val = char[key] as number;
    return `<tr>
      <td class="stat-name">${esc(label)}</td>
      <td class="num bold">${val}</td>
      <td class="num muted">${half(val)}</td>
      <td class="num muted">${fifth(val)}</td>
    </tr>`;
  }).join("\n");

  function skillRows(list: typeof skills) {
    if (!list || list.length === 0) return "";
    return list
      .map(
        (s) => `<tr>
      <td>${esc(s.skill_name)}</td>
      <td class="num bold">${s.current_value}</td>
      <td class="num muted">${half(s.current_value)}</td>
      <td class="num muted">${fifth(s.current_value)}</td>
    </tr>`
      )
      .join("\n");
  }

  const weaponsHtml =
    weapons.length > 0
      ? `<section>
  <h2>武器</h2>
  <table class="full-table">
    <thead>
      <tr>
        <th class="left">名前</th>
        <th>ダメージ</th>
        <th>射程</th>
        <th>装弾数</th>
        <th class="left">備考</th>
      </tr>
    </thead>
    <tbody>
      ${weapons
        .map(
          (w) => `<tr>
        <td class="bold">${esc(w.name)}</td>
        <td class="num">${esc(w.damage) || "—"}</td>
        <td class="num">${esc(w.range) || "—"}</td>
        <td class="num">${w.ammo_current != null ? `${w.ammo_current}/${w.ammo_max ?? "?"}` : "—"}</td>
        <td>${esc(w.notes) || ""}</td>
      </tr>`
        )
        .join("\n")}
    </tbody>
  </table>
</section>`
      : "";

  const inventoryHtml =
    otherItems.length > 0
      ? `<section>
  <h2>所持品</h2>
  <table class="full-table">
    <thead>
      <tr>
        <th class="left">アイテム名</th>
        <th class="left">備考</th>
      </tr>
    </thead>
    <tbody>
      ${otherItems
        .map(
          (item) => `<tr>
        <td class="bold">${esc(item.name)}</td>
        <td>${esc(item.notes) || ""}</td>
      </tr>`
        )
        .join("\n")}
    </tbody>
  </table>
</section>`
      : "";

  const skillsHtml =
    (skills ?? []).length > 0
      ? `<section>
  <h2>技能</h2>
  <div class="skills-grid">
    ${
      occupationSkills.length > 0
        ? `<div>
      <p class="skill-label">▶ 職業技能</p>
      <table class="full-table">
        <thead>
          <tr>
            <th class="left">技能名</th>
            <th>値</th>
            <th>1/2</th>
            <th>1/5</th>
          </tr>
        </thead>
        <tbody>${skillRows(occupationSkills)}</tbody>
      </table>
    </div>`
        : ""
    }
    ${
      otherSkills.length > 0
        ? `<div>
      <p class="skill-label">▶ その他技能</p>
      <table class="full-table">
        <thead>
          <tr>
            <th class="left">技能名</th>
            <th>値</th>
            <th>1/2</th>
            <th>1/5</th>
          </tr>
        </thead>
        <tbody>${skillRows(otherSkills)}</tbody>
      </table>
    </div>`
        : ""
    }
  </div>
</section>`
      : "";

  const backgroundHtml =
    char.background || char.notes
      ? `<section>
  <h2>背景・メモ</h2>
  ${
    char.background
      ? `<div class="text-block">
    <p class="block-label">背景・経歴</p>
    <p>${nl2br(char.background)}</p>
  </div>`
      : ""
  }
  ${
    char.notes
      ? `<div class="text-block">
    <p class="block-label">メモ</p>
    <p>${nl2br(char.notes)}</p>
  </div>`
      : ""
  }
</section>`
      : "";

  const portraitHtml = char.portrait_url
    ? `<img src="${esc(char.portrait_url)}" alt="${esc(char.name)}" class="portrait" />`
    : `<div class="portrait-placeholder">肖像なし</div>`;

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(char.name)} — キャラクターシート</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
    font-size: 13px;
    line-height: 1.6;
    color: #111;
    background: #fff;
    padding: 20px;
    max-width: 960px;
    margin: 0 auto;
  }
  h1 { font-size: 1.7em; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 4px; }
  h2 {
    font-size: 0.8em;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-bottom: 1px solid #999;
    padding-bottom: 3px;
    margin-bottom: 10px;
    margin-top: 24px;
    color: #333;
  }
  .header { display: flex; gap: 16px; margin-bottom: 20px; align-items: flex-start; }
  .header-text { flex: 1; }
  .status-badge {
    display: inline-block; border: 1px solid #555; font-size: 0.85em;
    padding: 1px 8px; border-radius: 3px; margin-left: 8px; vertical-align: middle;
  }
  .meta { font-size: 0.82em; color: #555; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 12px; }
  .catchphrase { font-style: italic; color: #666; font-size: 0.85em; margin-top: 4px; }
  .portrait { width: 100px; height: auto; border: 1px solid #ccc; border-radius: 4px; flex-shrink: 0; }
  .portrait-placeholder { width: 100px; height: 130px; border: 1px solid #ccc; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.75em; color: #aaa; text-align: center; flex-shrink: 0; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 0.85em; }
  th, td { border: 1px solid #ccc; padding: 3px 8px; }
  th { background: #f0f0f0; font-weight: 600; text-align: center; }
  .left { text-align: left; }
  .num { text-align: center; }
  .bold { font-weight: 600; }
  .muted { color: #666; }
  .stat-name { width: 120px; }
  .full-table { width: 100%; }
  .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .skill-label { font-size: 0.82em; font-weight: 600; color: #555; margin-bottom: 4px; }
  section { page-break-inside: avoid; }
  .text-block { margin-bottom: 10px; }
  .block-label { font-size: 0.82em; font-weight: 600; color: #555; margin-bottom: 3px; }
  .derived-table td:first-child { color: #555; }
  footer { margin-top: 32px; padding-top: 6px; border-top: 1px solid #ccc; font-size: 0.75em; color: #999; text-align: right; }
  .no-print { display: flex; align-items: center; justify-content: space-between; background: #f5f5f5; border-bottom: 1px solid #ccc; padding: 8px 16px; margin: -20px -20px 20px; }
  .print-btn { background: #222; color: #fff; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 0.9em; }
  .print-btn:hover { background: #444; }
  @media print {
    .no-print { display: none !important; }
    body { padding: 0; font-size: 11px; }
    h2 { margin-top: 16px; }
    @page { size: A4; margin: 12mm 15mm; }
  }
</style>
</head>
<body>

<div class="no-print">
  <span>キャラクターシート — ${esc(char.name)}</span>
  <button class="print-btn" onclick="window.print()">印刷 / PDFで保存</button>
</div>

<div class="header">
  ${portraitHtml}
  <div class="header-text">
    <h1>
      ${esc(char.name)}
      <span class="status-badge">${esc(STATUS_LABEL[char.status] ?? char.status)}</span>
    </h1>
    <div class="meta">
      ${char.occupation ? `<span>職業: ${esc(char.occupation)}</span>` : ""}
      ${char.age != null ? `<span>年齢: ${char.age}歳</span>` : ""}
      ${char.gender ? `<span>性別: ${esc(char.gender)}</span>` : ""}
      ${char.player_name ? `<span>PL: ${esc(char.player_name)}</span>` : ""}
      ${char.scenario_name ? `<span>シナリオ: ${esc(char.scenario_name)}</span>` : ""}
      ${char.rule_edition ? `<span>ルール: ${esc(char.rule_edition)}版</span>` : ""}
    </div>
    ${char.catchphrase ? `<p class="catchphrase">「${esc(char.catchphrase)}」</p>` : ""}
  </div>
</div>

<div class="two-col">
  <section>
    <h2>能力値</h2>
    <table>
      <thead>
        <tr>
          <th class="left stat-name">能力値</th>
          <th>値</th>
          <th>1/2</th>
          <th>1/5</th>
        </tr>
      </thead>
      <tbody>
        ${statsRows}
      </tbody>
    </table>
  </section>

  <section>
    <h2>派生ステータス</h2>
    <table class="derived-table">
      <tbody>
        <tr><td>HP 耐久力</td><td class="num bold">${char.hp_current} / ${char.hp_max}</td></tr>
        <tr><td>MP マジックポイント</td><td class="num bold">${char.mp_current} / ${char.mp_max}</td></tr>
        <tr><td>SAN 正気度（初期 ${char.san_start}）</td><td class="num bold">${char.san_current} / ${char.san_max}</td></tr>
        <tr><td>幸運</td><td class="num bold">${char.luck}</td></tr>
        <tr><td>ダメージボーナス</td><td class="num bold">${esc(db)}</td></tr>
        <tr><td>ビルド</td><td class="num bold">${build}</td></tr>
        <tr><td>移動力</td><td class="num bold">${mov}</td></tr>
      </tbody>
    </table>
  </section>
</div>

${skillsHtml}

${weaponsHtml}

${inventoryHtml}

${backgroundHtml}

<footer>CoC Portal — ${esc(char.name)} キャラクターシート</footer>

</body>
</html>`;

  const safeName = char.name.replace(/[^a-zA-Z0-9　-鿿゠-ヿぁ-ゖ]/g, "_");
  const filename = `character-sheet-${safeName}.html`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
