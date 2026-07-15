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

  const [{ data: clues }, { data: objectives }, { data: locations }] = await Promise.all([
    supabase.from("scenario_clues").select("title, status").eq("scenario_id", scenarioId),
    supabase.from("scenario_objectives").select("title, is_achieved").eq("scenario_id", scenarioId),
    supabase.from("scenario_locations").select("name, is_revealed").eq("scenario_id", scenarioId),
  ]);

  const resolvedClues = (clues ?? []).filter((c) => c.status === "resolved").map((c) => c.title);
  const unresolvedClues = (clues ?? []).filter((c) => c.status !== "resolved").map((c) => c.title);
  const achievedObjectives = (objectives ?? []).filter((o) => o.is_achieved).map((o) => o.title);
  const pendingObjectives = (objectives ?? []).filter((o) => !o.is_achieved).map((o) => o.title);
  const revealedLocations = (locations ?? []).filter((l) => l.is_revealed).map((l) => l.name);

  const lines = [
    "あなたはクトゥルフ神話TRPG（CoC）のセッション進行をサポートするAIです。",
    "以下の現在状況から、行き詰まったPLへの段階的ヒントを3段階でJSON配列として生成してください。",
    "",
    resolvedClues.length > 0 ? `解決済み手がかり: ${resolvedClues.join("、")}` : "解決済み手がかり: なし",
    unresolvedClues.length > 0 ? `未解決手がかり: ${unresolvedClues.join("、")}` : "未解決手がかり: なし",
    achievedObjectives.length > 0 ? `達成済み目標: ${achievedObjectives.join("、")}` : "達成済み目標: なし",
    pendingObjectives.length > 0 ? `未達成目標: ${pendingObjectives.join("、")}` : "未達成目標: なし",
    revealedLocations.length > 0 ? `訪問済みロケーション: ${revealedLocations.join("、")}` : "訪問済みロケーション: なし",
    "",
    "以下のJSON形式でのみ出力してください（コードブロック・前置きテキスト不要）:",
    '[{"level":1,"label":"①雰囲気レベル","text":"..."},{"level":2,"label":"②方向性レベル","text":"..."},{"level":3,"label":"③具体レベル","text":"..."}]',
    "",
    "ヒント生成の指示:",
    "① 雰囲気レベル: 情報を明かさず、不安や違和感・空気感だけを伝える（例：「何か大切なものが見落とされているような気がする…」）",
    "② 方向性レベル: 何を探すべきか・どこに注目すべきかを示唆する（例：「まだ調べていない場所や人物に手がかりが眠っているかもしれない」）",
    "③ 具体レベル: 次に取るべき具体的な行動を直接提案する（未達成目標や未解決手がかりに基づいて具体的に）",
  ]
    .filter((l) => l !== "")
    .join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{ role: "user", content: lines }],
  });

  const rawText = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();

  let hints: { level: number; label: string; text: string }[];
  try {
    hints = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ error: "AIレスポンスのパースに失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ hints });
}
