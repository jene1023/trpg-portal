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
  if (!body?.scenarioId) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  const { scenarioId } = body as { scenarioId: string };

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("title, synopsis, difficulty, min_players, max_players, playtime_type")
    .eq("id", scenarioId)
    .single();

  if (!scenario) {
    return NextResponse.json({ error: "シナリオが見つかりません。" }, { status: 404 });
  }

  const [
    { data: scenes },
    { data: creatures },
    { data: npcs },
    { data: handouts },
  ] = await Promise.all([
    supabase.from("scenario_scenes").select("title, notes").eq("scenario_id", scenarioId),
    supabase.from("creatures").select("name, hp, pow, san_loss_success, san_loss_failure, fear_rating, can_use_spells").eq("scenario_id", scenarioId),
    supabase.from("npcs").select("name, purpose").eq("scenario_name", scenario.title),
    supabase.from("handouts").select("id").eq("scenario_id", scenarioId),
  ]);

  const scenarioData = {
    title: scenario.title,
    synopsis: scenario.synopsis ?? "（なし）",
    player_range: scenario.min_players != null || scenario.max_players != null
      ? `${scenario.min_players ?? "?"}〜${scenario.max_players ?? "?"}人`
      : "未設定",
    playtime_type: scenario.playtime_type ?? "未設定",
    scene_count: scenes?.length ?? 0,
    scenes: (scenes ?? []).map((s) => s.title).join("、") || "（なし）",
    npc_count: npcs?.length ?? 0,
    creature_count: creatures?.length ?? 0,
    creatures: (creatures ?? []).map((c) => ({
      name: c.name,
      hp: c.hp,
      pow: c.pow,
      san_loss: `${c.san_loss_success ?? "?"}/${c.san_loss_failure ?? "?"}`,
      fear_rating: c.fear_rating,
      can_use_spells: c.can_use_spells,
    })),
    handout_count: handouts?.length ?? 0,
  };

  const prompt = [
    "あなたはCoC（クトゥルフ神話TRPG）のKP（ゲームマスター）向けシナリオ難易度評価AIです。",
    "以下のシナリオ情報をもとに、難易度を客観的に評価してください。",
    "",
    "【シナリオ情報】",
    JSON.stringify(scenarioData, null, 2),
    "",
    "【評価基準】",
    "- beginner（初心者向け）: シーン数が少なく、クリーチャーが弱め（HP低・SAN喪失小）、NPCが少数、ハンドアウトが少なく情報が分かりやすい",
    "- intermediate（中級）: 中程度のシーン数、複数のクリーチャーや複雑なNPC関係、複数ハンドアウトによる情報整理が必要",
    "- advanced（上級）: 多くのシーン数、強力なクリーチャー（高HP・高SAN喪失・呪文使用可）、多数のNPC・ハンドアウト、複雑な謎解き",
    "",
    "以下のJSON形式のみで回答してください（説明文は不要）:",
    '{"difficulty_label": "beginner" | "intermediate" | "advanced", "reasoning": "評価理由を2〜3文で", "suggestions": ["調整ヒント1", "調整ヒント2", "調整ヒント3"]}',
  ].join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const parsed = parseJSON(text);
  if (!parsed) {
    return NextResponse.json({ error: "AIの応答を解析できませんでした。", raw: text }, { status: 500 });
  }

  return NextResponse.json({ result: parsed });
}

function parseJSON(text: string): { difficulty_label: string; reasoning: string; suggestions: string[] } | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
