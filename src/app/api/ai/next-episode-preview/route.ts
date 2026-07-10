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

  const { unresolved_threads, cliffhanger, npc_threat } = body as {
    unresolved_threads?: string;
    cliffhanger?: string;
    npc_threat?: string;
  };

  if (!unresolved_threads && !cliffhanger && !npc_threat) {
    return NextResponse.json({ error: "少なくとも1つのフィールドを入力してください。" }, { status: 400 });
  }

  const lines = [
    "あなたはクトゥルフ神話TRPGのリプレイ次回予告専門ライターです。",
    "以下の情報をもとに、次回セッションへの期待と緊張感を高める「次回予告」風のドラマティックなテキストを100〜150字の日本語で生成してください。",
    "見出しや箇条書きは不要です。一段落の煽りテキストとして出力してください。",
    "",
  ];

  if (unresolved_threads) lines.push(`未解決の伏線・プロットスレッド: ${unresolved_threads}`);
  if (cliffhanger) lines.push(`崖っぷち描写（クリフハンガー）: ${cliffhanger}`);
  if (npc_threat) lines.push(`次回のNPCの動き・脅威: ${npc_threat}`);

  lines.push("", "次回予告:");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: lines.join("\n") }],
  });

  const preview = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();

  return NextResponse.json({ preview });
}
