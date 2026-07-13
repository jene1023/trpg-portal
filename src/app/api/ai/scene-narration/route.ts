import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY が設定されていません。" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  const { location, weather, mood, playerCount } = body as {
    location?: string;
    weather?: string;
    mood?: string;
    playerCount?: number;
  };

  if (!location || !weather || !mood) {
    return NextResponse.json({ error: "location・weather・mood は必須です。" }, { status: 400 });
  }

  const lines = [
    "クトゥルフ神話TRPGのKP（キーパー）が即興でシーンを描写するためのナレーション文章を3パターン生成してください。",
    "",
    `場所・舞台: ${location}`,
    `天候・時間帯: ${weather}`,
    `感情トーン・雰囲気: ${mood}`,
    playerCount ? `参加プレイヤー数: ${playerCount}人` : "",
    "",
    "以下の形式でJSON配列として出力してください（他のテキストは不要）:",
    '[{"label":"簡潔版","text":"..."},{"label":"ドラマチック版","text":"..."},{"label":"ホラー版","text":"..."}]',
    "",
    "各パターンの条件:",
    "・簡潔版: 2〜3文、情景をシンプルに伝える",
    "・ドラマチック版: 4〜5文、緊張感と臨場感を高める",
    "・ホラー版: 4〜5文、不安・恐怖・不気味さを前面に出す",
    "・すべて日本語、探索者たちへの二人称（「あなたたちは」など）を使用",
    "・CoC特有の重苦しい雰囲気を維持",
  ]
    .filter((l) => l !== "")
    .join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: lines }],
  });

  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();

  let narrations: { label: string; text: string }[];
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    narrations = JSON.parse(match ? match[0] : raw);
  } catch {
    return NextResponse.json({ error: "AI の出力をパースできませんでした。再試行してください。" }, { status: 500 });
  }

  return NextResponse.json({ narrations });
}
