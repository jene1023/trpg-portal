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

  const { scenarioId } = body as { scenarioId?: string };
  if (!scenarioId) {
    return NextResponse.json({ error: "scenarioId は必須です。" }, { status: 400 });
  }

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("title")
    .eq("id", scenarioId)
    .single();

  if (!scenario) {
    return NextResponse.json({ error: "シナリオが見つかりません。" }, { status: 404 });
  }

  const { data: participantRows } = await supabase
    .from("scenario_participants")
    .select("character_id")
    .eq("scenario_id", scenarioId);

  const characterIds = (participantRows ?? []).map((p) => p.character_id).filter(Boolean);

  const [{ data: sessionLogs }, { data: resolvedClues }, { data: plotThreads }] = await Promise.all([
    characterIds.length > 0
      ? supabase
          .from("sessions")
          .select("title, summary, san_loss, hp_loss, played_at")
          .in("character_id", characterIds)
          .order("played_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase
      .from("scenario_clues")
      .select("title, content")
      .eq("scenario_id", scenarioId)
      .eq("status", "resolved"),
    supabase
      .from("plot_threads")
      .select("title, status")
      .eq("scenario_id", scenarioId),
  ]);

  const lines: string[] = [
    "以下のセッションログ・解決した手がかり・プロットの状況を元に、次回セッション開幕直前に読み上げる「前回のあらすじ」を400字程度のドラマチックな日本語ナレーションとして生成してください。",
    "見出しや箇条書きは不要です。一段落の流れるようなナレーションテキストとして出力してください。",
    "",
    `シナリオ: ${scenario.title}`,
    "",
  ];

  if ((sessionLogs ?? []).length > 0) {
    lines.push("【セッションログ】");
    for (const s of sessionLogs ?? []) {
      const date = s.played_at ? `（${s.played_at}）` : "";
      lines.push(`- ${s.title}${date}`);
      if (s.summary) lines.push(`  ${s.summary}`);
      if ((s.san_loss ?? 0) > 0) lines.push(`  SAN喪失: ${s.san_loss}点`);
      if ((s.hp_loss ?? 0) > 0) lines.push(`  HP喪失: ${s.hp_loss}点`);
    }
    lines.push("");
  }

  if ((resolvedClues ?? []).length > 0) {
    lines.push("【解決済み手がかり】");
    for (const c of resolvedClues ?? []) {
      lines.push(`- ${c.title}${c.content ? `: ${c.content}` : ""}`);
    }
    lines.push("");
  }

  if ((plotThreads ?? []).length > 0) {
    lines.push("【プロットスレッド】");
    for (const t of plotThreads ?? []) {
      const statusLabel =
        t.status === "pending" ? "進行中" : t.status === "revealed" ? "判明" : "放棄";
      lines.push(`- ${t.title}（${statusLabel}）`);
    }
    lines.push("");
  }

  lines.push("前回のあらすじ:");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{ role: "user", content: lines.join("\n") }],
  });

  const narrative = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();

  return NextResponse.json({ narrative });
}
