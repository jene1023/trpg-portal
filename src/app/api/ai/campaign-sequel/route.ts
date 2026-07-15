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

  const { survivingCharacters, worldChanges, carriedOverThreads } = body as {
    survivingCharacters?: string[];
    worldChanges?: string;
    carriedOverThreads?: string;
  };

  const charList = (survivingCharacters ?? []).join("、") || "（不明）";
  const world = worldChanges?.trim() || "（記述なし）";
  const threads = carriedOverThreads?.trim() || "（持ち越しなし）";

  const prompt = [
    "以下の引き継ぎ情報から、TRPGキャンペーンのシーズン2（続編）のオープニングシーン設計案と最初のシナリオへの導入フックを提案してください。",
    "クトゥルフ神話TRPGの雰囲気に合わせ、不気味さ・謎・人間ドラマを意識した提案をしてください。",
    "",
    "【生存キャラクター】",
    charList,
    "",
    "【世界の変化（前キャンペーンの結末）】",
    world,
    "",
    "【持ち越しプロットスレッド】",
    threads,
    "",
    "以下の形式でマークダウンを使わずプレーンテキストで出力してください：",
    "▼ オープニングシーン案",
    "（セッション冒頭のシーン描写案を3〜5文で）",
    "",
    "▼ 導入フック1",
    "（タイトル）: （内容）",
    "",
    "▼ 導入フック2",
    "（タイトル）: （内容）",
    "",
    "▼ 導入フック3",
    "（タイトル）: （内容）",
    "",
    "▼ KPへのメモ",
    "（前キャンペーンとの連続性を活かすヒント）",
  ].join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const suggestion = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();

  return NextResponse.json({ suggestion });
}
