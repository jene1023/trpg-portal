import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type SkillRecommendation = {
  skill_name: string;
  reason: string;
  expected_gain: number;
};

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

  const { characterId } = body as { characterId?: string };
  if (!characterId) {
    return NextResponse.json({ error: "characterId は必須です。" }, { status: 400 });
  }

  const [{ data: diceRolls }, { data: skills }] = await Promise.all([
    supabase
      .from("dice_rolls")
      .select("skill_name, skill_value, roll_value, success_level, rolled_at")
      .eq("character_id", characterId)
      .order("rolled_at", { ascending: false })
      .limit(100),
    supabase
      .from("character_skills")
      .select("skill_name, base_value, current_value, is_occupation, growth_checked")
      .eq("character_id", characterId),
  ]);

  if ((!diceRolls || diceRolls.length === 0) && (!skills || skills.length === 0)) {
    return NextResponse.json({ error: "ダイスロール履歴もスキルデータもありません。" }, { status: 400 });
  }

  const skillStats: Record<string, { uses: number; successes: number }> = {};
  for (const roll of diceRolls ?? []) {
    if (!skillStats[roll.skill_name]) skillStats[roll.skill_name] = { uses: 0, successes: 0 };
    skillStats[roll.skill_name].uses++;
    if (roll.success_level === "success" || roll.success_level === "critical_success") {
      skillStats[roll.skill_name].successes++;
    }
  }

  const rollSummary = Object.entries(skillStats)
    .sort(([, a], [, b]) => b.uses - a.uses)
    .map(([name, stat]) => {
      const rate = stat.uses > 0 ? Math.round((stat.successes / stat.uses) * 100) : 0;
      return `${name}: 使用${stat.uses}回、成功率${rate}%`;
    })
    .join("\n");

  const skillList = (skills ?? [])
    .map((s) => `${s.skill_name}: 現在値${s.current_value}（基本値${s.base_value}）`)
    .join("\n");

  const prompt = [
    "以下のダイスロール履歴とスキル一覧を分析し、成長させるべきスキルTOP3を理由（使用頻度・成功率・現在値の伸び代）とともにJSON形式で返してください。スキル名・推薦理由・期待成功率向上値を含めること。",
    "",
    "【ダイスロール履歴（直近100件の集計）】",
    rollSummary || "（記録なし）",
    "",
    "【スキル一覧】",
    skillList || "（記録なし）",
    "",
    "以下のJSON配列形式のみで出力してください（コードブロック・前置きテキスト不要）:",
    '[{"skill_name":"スキル名","reason":"推薦理由（100字程度）","expected_gain":10}]',
  ].join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();

  let recommendations: SkillRecommendation[];
  try {
    recommendations = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ error: "AIレスポンスのパースに失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ recommendations });
}
