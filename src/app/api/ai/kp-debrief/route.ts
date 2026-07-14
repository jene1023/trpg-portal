import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY が設定されていません。" }, { status: 503 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase が設定されていません。" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  const { scenarioId } = body as { scenarioId?: string };
  if (!scenarioId) {
    return NextResponse.json({ error: "scenarioId は必須です。" }, { status: 400 });
  }

  const [{ data: scenario }, { data: participantRows }, { data: ratingRows }] = await Promise.all([
    supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
    supabase
      .from("scenario_participants")
      .select("character_id, characters(id, name)")
      .eq("scenario_id", scenarioId),
    supabase
      .from("scenario_player_ratings")
      .select("fun_rating, horror_rating, mystery_rating, character_rating")
      .eq("scenario_id", scenarioId),
  ]);

  if (!scenario) {
    return NextResponse.json({ error: "シナリオが見つかりません。" }, { status: 404 });
  }

  const characterIds = (
    (participantRows ?? []) as unknown as { characters: { id: string } | null }[]
  )
    .map((p) => p.characters?.id)
    .filter(Boolean) as string[];

  const [{ data: sessionRows }, { data: diceRows }] = await Promise.all([
    characterIds.length > 0
      ? supabase
          .from("sessions")
          .select("id, san_loss, hp_loss")
          .in("character_id", characterIds)
      : Promise.resolve({ data: [] as { id: string; san_loss: number; hp_loss: number }[] }),
    characterIds.length > 0
      ? supabase
          .from("dice_rolls")
          .select("success_level")
          .in("character_id", characterIds)
      : Promise.resolve({ data: [] as { success_level: string }[] }),
  ]);

  const sessionIds = (sessionRows ?? []).map((s) => s.id);
  const { data: encounterRows } = sessionIds.length > 0
    ? await supabase
        .from("session_npc_encounters")
        .select("npc_id, npcs(name)")
        .in("session_id", sessionIds)
    : { data: [] as never[] };

  const sessions = sessionRows ?? [];
  const totalSanLoss = sessions.reduce((sum, s) => sum + (s.san_loss ?? 0), 0);
  const totalHpLoss = sessions.reduce((sum, s) => sum + (s.hp_loss ?? 0), 0);

  const dice = diceRows ?? [];
  const totalRolls = dice.length;
  const successCount = dice.filter(
    (r) => r.success_level === "success" || r.success_level === "critical_success"
  ).length;
  const successRate = totalRolls > 0 ? Math.round((successCount / totalRolls) * 100) : null;

  const seenNpcIds = new Set<string>();
  const uniqueNpcs: string[] = [];
  for (const e of (encounterRows ?? []) as unknown as { npc_id: string; npcs: { name: string } | null }[]) {
    if (!seenNpcIds.has(e.npc_id)) {
      seenNpcIds.add(e.npc_id);
      uniqueNpcs.push(e.npcs?.name ?? "（不明なNPC）");
    }
  }

  const ratings = ratingRows ?? [];
  const ratingCount = ratings.length;
  const avgRating =
    ratingCount > 0
      ? {
          fun: (ratings.reduce((s, r) => s + r.fun_rating, 0) / ratingCount).toFixed(1),
          horror: (ratings.reduce((s, r) => s + r.horror_rating, 0) / ratingCount).toFixed(1),
          mystery: (ratings.reduce((s, r) => s + r.mystery_rating, 0) / ratingCount).toFixed(1),
          character: (ratings.reduce((s, r) => s + r.character_rating, 0) / ratingCount).toFixed(1),
        }
      : null;

  const participantCount = characterIds.length;

  const lines = [
    "あなたはクトゥルフ神話TRPG（CoC）のキーパー（KP）です。以下のセッションデータを分析し、KP向けの振り返りレポートをJSON形式で出力してください。",
    "",
    `シナリオ名: ${scenario.title}`,
    `参加者数: ${participantCount}人`,
    totalSanLoss > 0 ? `総SAN喪失量: ${totalSanLoss}点` : "",
    totalHpLoss > 0 ? `総HP喪失量: ${totalHpLoss}点` : "",
    successRate !== null ? `ダイス成功率: ${successRate}%（全${totalRolls}回）` : "",
    uniqueNpcs.length > 0 ? `遭遇したNPC/クリーチャー: ${uniqueNpcs.join("、")}` : "",
    avgRating
      ? `PLの評価平均 — 楽しさ: ${avgRating.fun} / 恐怖演出: ${avgRating.horror} / 謎解き: ${avgRating.mystery} / キャラ活躍度: ${avgRating.character}`
      : "",
    "",
    "以下のJSON形式でのみ出力してください（コードブロック・前置きテキスト不要）:",
    `{"went_well":["..."],"improvements":["..."],"next_suggestions":["..."]}`,
    "",
    "指示:",
    "① went_well: 演出・ペース管理・プレイヤー体験などうまくいった点を2〜4項目",
    "② improvements: SAN喪失の偏りや目標達成の観点から改善できる点を2〜3項目",
    "③ next_suggestions: 次回セッションへの具体的な提案を必ず3項目",
  ]
    .filter((l) => l !== "")
    .join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [{ role: "user", content: lines }],
  });

  const rawText = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();

  let result: { went_well: string[]; improvements: string[]; next_suggestions: string[] };
  try {
    result = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ error: "AIレスポンスのパースに失敗しました。" }, { status: 500 });
  }

  return NextResponse.json(result);
}
