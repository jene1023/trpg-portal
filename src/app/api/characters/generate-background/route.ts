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

  const { occupation, rule_edition, str, con, pow, dex, app, siz, int_stat, edu } = body as {
    occupation?: string;
    rule_edition?: "6th" | "7th";
    str?: number;
    con?: number;
    pow?: number;
    dex?: number;
    app?: number;
    siz?: number;
    int_stat?: number;
    edu?: number;
  };

  const editionLabel = rule_edition === "6th" ? "6版（1920年代）" : rule_edition === "7th" ? "7版（現代）" : null;

  const statLine = [
    str != null && `STR:${str}`,
    con != null && `CON:${con}`,
    pow != null && `POW:${pow}`,
    dex != null && `DEX:${dex}`,
    app != null && `APP:${app}`,
    siz != null && `SIZ:${siz}`,
    int_stat != null && `INT:${int_stat}`,
    edu != null && `EDU:${edu}`,
  ]
    .filter(Boolean)
    .join(" / ");

  const prompt = [
    "CoC（クトゥルフ神話TRPG）の探索者キャラクターとして、以下の情報をもとに日本語でキャラクター設定を提案してください。",
    occupation ? `職業: ${occupation}` : "",
    editionLabel ? `ルールエディション: ${editionLabel}` : "",
    statLine ? `能力値: ${statLine}` : "",
    "",
    "以下の項目をそれぞれ1つずつ、具体的かつ簡潔に提案してください。",
    "- 背景（生い立ちや経歴、100字程度）",
    "- 性格的特質（個性や癖、50字程度）",
    "- 外見の特徴（容姿や服装など、50字程度）",
    "- 重要な人物（関係者1名、50字程度）",
    "- 大切な宝物（所持品や思い出の品、50字程度）",
    "",
    "各項目はラベルと内容を「ラベル: 内容」の形式で出力してください。",
  ]
    .filter((l) => l !== null)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const parsed = parseResponse(text);

  return NextResponse.json({ result: parsed, raw: text });
}

function parseResponse(text: string): Record<string, string> {
  const labels: Record<string, string> = {
    "背景": "background",
    "性格的特質": "personality",
    "外見の特徴": "appearance",
    "重要な人物": "person",
    "大切な宝物": "treasure",
  };

  const result: Record<string, string> = {};
  const lines = text.split("\n");

  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const rawLabel = line.slice(0, colonIdx).replace(/^[-・\s]+/, "").trim();
    const value = line.slice(colonIdx + 1).trim();
    for (const [jpLabel, key] of Object.entries(labels)) {
      if (rawLabel.includes(jpLabel)) {
        result[key] = value;
        break;
      }
    }
  }

  return result;
}
