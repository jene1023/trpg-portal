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

  const { npcId, situation } = body as { npcId?: string; situation?: string };
  if (!npcId || !situation) {
    return NextResponse.json({ error: "npcId と situation は必須です。" }, { status: 400 });
  }

  const { data: npc } = await supabase
    .from("npcs")
    .select("name, purpose, speech_style, sample_quotes, appearance, notes")
    .eq("id", npcId)
    .single();

  if (!npc) {
    return NextResponse.json({ error: "NPC が見つかりません。" }, { status: 404 });
  }

  const lines = [
    "CoCシナリオ（クトゥルフ神話TRPG）のセッション中のNPCとして、以下のNPC情報に基づいた発話例を日本語で3パターン生成してください。",
    "",
    `NPC名: ${npc.name}`,
    npc.purpose ? `目的・役割: ${npc.purpose}` : "",
    npc.speech_style ? `口調・一人称: ${npc.speech_style}` : "",
    npc.sample_quotes ? `セリフ例・口癖: ${npc.sample_quotes}` : "",
    npc.appearance ? `外見: ${npc.appearance}` : "",
    npc.notes ? `メモ: ${npc.notes}` : "",
    "",
    `シチュエーション: ${situation}`,
    "",
    "このシチュエーションでNPCが言いそうなセリフを3パターン生成してください。",
    "各パターンは1〜3文程度で、NPCの口調や性格を反映させてください。",
    "出力形式:",
    "1. （セリフ）",
    "2. （セリフ）",
    "3. （セリフ）",
  ]
    .filter((l) => l !== null)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: lines }],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const dialogues = parseDialogues(text);

  return NextResponse.json({ dialogues, raw: text });
}

function parseDialogues(text: string): string[] {
  const matches = text.match(/[1-3][.．。)）]\s*[「]?([\s\S]*?)(?=[「]?[1-3][.．。)）]|$)/g);
  if (matches && matches.length > 0) {
    return matches
      .map((m) => m.replace(/^[1-3][.．。)）]\s*/, "").trim())
      .filter((s) => s.length > 0)
      .slice(0, 3);
  }
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  return lines.slice(0, 3);
}
