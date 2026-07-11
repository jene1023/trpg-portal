export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  SessionLog,
  DiceRoll,
  GrowthHistory,
  ScenarioClue,
} from "@/lib/supabase";
import SessionReportPanel from "@/app/_components/SessionReportPanel";

type Props = { params: Promise<{ id: string; sessionId: string }> };

export default async function SessionReportPage({ params }: Props) {
  const { id, sessionId } = await params;

  if (!isSupabaseConfigured) notFound();

  const [{ data: char }, { data: session }] = await Promise.all([
    supabase
      .from("characters")
      .select("id, name, occupation")
      .eq("id", id)
      .single(),
    supabase.from("sessions").select("*").eq("id", sessionId).single(),
  ]);

  if (!char || !session) notFound();

  const log = session as unknown as SessionLog;
  const playedAt = log.played_at;

  let nextDay: string | null = null;
  if (playedAt) {
    const d = new Date(playedAt);
    d.setDate(d.getDate() + 1);
    nextDay = d.toISOString().slice(0, 10);
  }

  const [{ data: diceRolls }, { data: growthHistory }, { data: clues }] =
    await Promise.all([
      playedAt && nextDay
        ? supabase
            .from("dice_rolls")
            .select("*")
            .eq("character_id", id)
            .gte("rolled_at", playedAt)
            .lt("rolled_at", nextDay)
            .order("rolled_at", { ascending: true })
        : supabase
            .from("dice_rolls")
            .select("*")
            .eq("character_id", id)
            .order("rolled_at", { ascending: false })
            .limit(30),
      supabase
        .from("growth_history")
        .select("*")
        .eq("character_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("scenario_clues")
        .select("*")
        .eq("character_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/characters/${id}/sessions/${sessionId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          セッション{log.session_number}：{log.title}
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-2">
        プレイレポート生成
      </h1>
      <p className="text-xs text-coc-muted mb-6">
        セッションデータを自動集計してHTMLレポートをダウンロードできます。
      </p>

      <SessionReportPanel
        characterId={id}
        sessionId={sessionId}
        characterName={char.name}
        occupation={char.occupation}
        session={log}
        diceRolls={(diceRolls ?? []) as DiceRoll[]}
        growthHistory={(growthHistory ?? []) as GrowthHistory[]}
        clues={(clues ?? []) as ScenarioClue[]}
      />
    </div>
  );
}
