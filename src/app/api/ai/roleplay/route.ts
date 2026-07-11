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

  const { characterId, messages, scenario } = body as {
    characterId?: string;
    messages?: { role: "user" | "assistant"; content: string }[];
    scenario?: string;
  };

  if (!characterId || !Array.isArray(messages)) {
    return NextResponse.json({ error: "characterId と messages は必須です。" }, { status: 400 });
  }

  const { data: char } = await supabase
    .from("characters")
    .select("name, age, occupation, background, speech_style")
    .eq("id", characterId)
    .single();

  if (!char) {
    return NextResponse.json({ error: "キャラクターが見つかりません。" }, { status: 404 });
  }

  const { data: traits } = await supabase
    .from("character_traits")
    .select("trait_type, content")
    .eq("character_id", characterId);

  const systemLines = [
    "あなたはクトゥルフ神話TRPG（CoC）のロールプレイ練習セッションを担当するGMです。",
    "プレイヤーが以下の探索者キャラクターを演じる練習ができるよう、NPCや状況として対話してください。",
    "必ず日本語で回答し、1〜3文程度の短い返答を心がけてください。",
    "",
    "【探索者情報】",
    `名前: ${char.name}`,
    char.age ? `年齢: ${char.age}歳` : "",
    char.occupation ? `職業: ${char.occupation}` : "",
    char.background ? `背景・経歴: ${char.background}` : "",
    char.speech_style ? `口調・話し方の特徴: ${char.speech_style}` : "",
  ].filter((l) => l !== "");

  if (traits && traits.length > 0) {
    const traitMap: Record<string, string[]> = {};
    for (const t of traits) {
      if (!traitMap[t.trait_type]) traitMap[t.trait_type] = [];
      traitMap[t.trait_type].push(t.content);
    }
    if (traitMap.personality?.length) {
      systemLines.push(`性格的特質: ${traitMap.personality.join("、")}`);
    }
    if (traitMap.ideology?.length) {
      systemLines.push(`イデオロギー・信念: ${traitMap.ideology.join("、")}`);
    }
    if (traitMap.person?.length) {
      systemLines.push(`重要な人物: ${traitMap.person.join("、")}`);
    }
  }

  systemLines.push(
    "",
    "【あなたの役割】",
    "・GMまたはNPCとして自然に対話し、探索者のロールプレイ練習をサポートしてください。",
    "・プレイヤーのセリフに対して、CoC世界観に合った反応や状況を提供してください。",
    "・探索者の背景・信念を踏まえた場面を作り出し、キャラクターの「声」を見つける手助けをしてください。",
    "・怪異や神話的要素を適度に交えながら、緊張感のある探索雰囲気を演出してください。"
  );

  if (scenario) {
    systemLines.push("", "【シナリオ設定】", scenario);
  }

  const systemPrompt = systemLines.join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: systemPrompt,
    messages: messages.slice(-20),
  });

  const reply = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();

  return NextResponse.json({ reply });
}
