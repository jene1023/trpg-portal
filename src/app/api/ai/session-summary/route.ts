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

  const { sessionId, characterId } = body as { sessionId?: string; characterId?: string };
  if (!sessionId || !characterId) {
    return NextResponse.json({ error: "sessionId と characterId は必須です。" }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "セッションログが見つかりません。" }, { status: 404 });
  }

  const { data: character } = await supabase
    .from("characters")
    .select("name, occupation")
    .eq("id", characterId)
    .single();

  const { data: diceRolls } = await supabase
    .from("dice_rolls")
    .select("skill_name, roll_value, success_level")
    .eq("character_id", characterId)
    .in("success_level", ["critical_success", "fumble"])
    .gte("rolled_at", session.played_at ?? "1970-01-01");

  const highlights = (diceRolls ?? [])
    .map((r) => {
      const label = r.success_level === "critical_success" ? "決定的成功" : "致命的失敗";
      return `${r.skill_name} ${r.roll_value}（${label}）`;
    })
    .slice(0, 5);

  const lines = [
    "クトゥルフ神話TRPG（CoC）のセッションログをもとに、リプレイ風のナラティブな要約（200〜300字程度）を日本語で生成してください。",
    "",
    `セッションタイトル: ${session.title}`,
    `セッション番号: ${session.session_number}`,
    session.played_at ? `プレイ日: ${session.played_at}` : "",
    character ? `探索者: ${character.name}${character.occupation ? `（${character.occupation}）` : ""}` : "",
    session.summary ? `既存のメモ: ${session.summary}` : "",
    session.san_loss > 0 ? `SAN喪失: ${session.san_loss}点` : "",
    session.hp_loss > 0 ? `HP喪失: ${session.hp_loss}点` : "",
    highlights.length > 0 ? `ダイスハイライト: ${highlights.join("、")}` : "",
    "",
    "以下の形式で出力してください：",
    "・探索者の視点を活かした三人称または日記風の語り",
    "・200〜300字程度",
    "・見出しや箇条書きは不要、一段落の文章として",
  ]
    .filter((l) => l !== "")
    .join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{ role: "user", content: lines }],
  });

  const summary = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();

  return NextResponse.json({ summary });
}
