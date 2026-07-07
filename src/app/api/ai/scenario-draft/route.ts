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

  const { title, setting, era, keywords, num_players } = body as {
    title?: string;
    setting?: string;
    era?: string;
    keywords?: string;
    num_players?: string;
  };

  const lines = [
    "CoC（クトゥルフ神話TRPG）のシナリオ作成を手伝ってください。以下の情報をもとに、KP向けのシナリオシノプシスとGMメモ下書きを日本語で生成してください。",
    "",
    title ? `タイトル: ${title}` : "",
    setting ? `舞台・場所: ${setting}` : "",
    era ? `時代設定: ${era}` : "",
    keywords ? `主要キーワード・テーマ: ${keywords}` : "",
    num_players ? `プレイ人数: ${num_players}` : "",
    "",
    "以下の2つのセクションを出力してください:",
    "",
    "シノプシス: （PLに見せる概要。200字程度。シナリオの舞台・状況・探索者が巻き込まれる経緯を魅力的に記述する）",
    "",
    "GMメモ: （KP専用の秘密情報。200字程度。シナリオの真相・KPが把握しておくべき裏設定・進行上の注意点を記述する）",
  ].filter((l) => l !== null).join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 800,
    messages: [{ role: "user", content: lines }],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const parsed = parseResponse(text);

  return NextResponse.json({ result: parsed, raw: text });
}

function parseResponse(text: string): { synopsis: string; gm_notes: string } {
  const synopsisMatch = text.match(/シノプシス[：:]\s*([\s\S]*?)(?=\n\nGMメモ|GMメモ[：:]|$)/);
  const gmNotesMatch = text.match(/GMメモ[：:]\s*([\s\S]*?)$/);

  return {
    synopsis: synopsisMatch ? synopsisMatch[1].trim() : "",
    gm_notes: gmNotesMatch ? gmNotesMatch[1].trim() : "",
  };
}
