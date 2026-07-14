import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SUCCESS_LEVEL_LABEL: Record<string, string> = {
  critical_success: "決定的成功",
  success: "通常成功",
  failure: "失敗",
  fumble: "致命的失敗",
};

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY が設定されていません。" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  const { skillName, successLevel, characterOccupation, sceneContext } = body as {
    skillName?: string;
    successLevel?: string;
    characterOccupation?: string;
    sceneContext?: string;
  };

  if (!skillName || !successLevel) {
    return NextResponse.json({ error: "skillName と successLevel は必須です。" }, { status: 400 });
  }

  const levelLabel = SUCCESS_LEVEL_LABEL[successLevel] ?? successLevel;
  const occupation = characterOccupation || "探索者";
  const scene = sceneContext?.trim() || "不明なシーン";

  const prompt = [
    `CoC 7版の探索者が『${skillName}』判定で『${levelLabel}』を出しました。`,
    `職業は${occupation}。`,
    `以下のシーンで起きたこと: ${scene}`,
    `この瞬間を60字以内の情景描写で表現してください。`,
    `セリフや説明文は不要です。情景のみを簡潔に描写してください。`,
  ].join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const narration = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();

  return NextResponse.json({ narration });
}
