export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

type SessionEvent = {
  kind: "session";
  id: string;
  characterId: string;
  sessionNumber: number;
  title: string;
  summary: string | null;
  sanLoss: number;
  hpLoss: number;
  date: string | null;
};

type DiceEvent = {
  kind: "dice";
  id: string;
  characterId: string;
  skillName: string;
  skillValue: number;
  rollValue: number;
  successLevel: "critical_success" | "fumble";
  date: string;
};

type TimelineEvent = SessionEvent | DiceEvent;

function nodeClass(event: TimelineEvent): string {
  if (event.kind === "session") {
    const s = event as SessionEvent;
    if (s.sanLoss >= 5) return "bg-red-600 border-red-500";
    if (s.sanLoss >= 1) return "bg-yellow-600 border-yellow-500";
    return "bg-coc-gold border-coc-gold";
  }
  const d = event as DiceEvent;
  return d.successLevel === "critical_success"
    ? "bg-green-600 border-green-500"
    : "bg-purple-600 border-purple-500";
}

export default async function ReplayPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: participantRows } = await supabase
    .from("scenario_participants")
    .select("character_id, characters(name)")
    .eq("scenario_id", id);

  const participants = (participantRows ?? []) as unknown as {
    character_id: string;
    characters: { name: string } | null;
  }[];

  const characterNames: Record<string, string> = {};
  for (const p of participants) {
    if (p.characters) {
      characterNames[p.character_id] = p.characters.name;
    }
  }

  const characterIds = Object.keys(characterNames);

  const events: TimelineEvent[] = [];

  if (characterIds.length > 0) {
    const [{ data: sessions }, { data: diceRolls }] = await Promise.all([
      supabase
        .from("sessions")
        .select("id, character_id, session_number, title, summary, san_loss, hp_loss, played_at")
        .in("character_id", characterIds),
      supabase
        .from("dice_rolls")
        .select("id, character_id, skill_name, skill_value, roll_value, success_level, rolled_at")
        .in("character_id", characterIds)
        .in("success_level", ["critical_success", "fumble"])
        .order("rolled_at", { ascending: true }),
    ]);

    for (const s of sessions ?? []) {
      events.push({
        kind: "session",
        id: s.id,
        characterId: s.character_id,
        sessionNumber: s.session_number,
        title: s.title,
        summary: s.summary,
        sanLoss: s.san_loss ?? 0,
        hpLoss: s.hp_loss ?? 0,
        date: s.played_at,
      });
    }

    for (const d of diceRolls ?? []) {
      events.push({
        kind: "dice",
        id: d.id,
        characterId: d.character_id,
        skillName: d.skill_name,
        skillValue: d.skill_value,
        rollValue: d.roll_value,
        successLevel: d.success_level as "critical_success" | "fumble",
        date: d.rolled_at,
      });
    }
  }

  events.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {scenario.title}
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-2">リプレイ</h1>
      <p className="text-xs text-coc-muted mb-8">
        全参加者のセッションログとクリティカル・ファンブル判定を時系列で振り返ります。
      </p>

      {events.length === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center text-coc-muted text-sm">
          記録がまだありません。
          <br />
          <Link
            href={`/scenarios/${id}/participants`}
            className="mt-3 inline-block text-coc-gold hover:underline"
          >
            参加者を登録する →
          </Link>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-coc-border" />

          <ol className="space-y-6">
            {events.map((event) => {
              const charName = characterNames[event.characterId] ?? "不明";
              return (
                <li key={`${event.kind}-${event.id}`} className="relative pl-12">
                  <div
                    className={`absolute left-2 top-2 w-5 h-5 -translate-x-1/2 rounded-full border-2 ${nodeClass(event)}`}
                  />

                  <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full border border-coc-gold/40 bg-coc-gold/10 px-2 py-0.5 text-xs font-medium text-coc-gold">
                          {charName}
                        </span>
                        {event.kind === "session" ? (
                          <>
                            <span className="font-cinzel text-xs text-coc-muted uppercase tracking-widest">
                              #{event.sessionNumber}
                            </span>
                            <span className="font-semibold text-coc-text text-sm">
                              {event.title}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-semibold text-coc-text">
                            {event.successLevel === "critical_success"
                              ? "決定的成功"
                              : "ファンブル"}
                            ：{event.skillName}
                          </span>
                        )}
                      </div>
                      {event.date && (
                        <time className="text-xs text-coc-muted shrink-0">
                          {event.kind === "session"
                            ? new Date(event.date).toLocaleDateString("ja-JP")
                            : new Date(event.date).toLocaleString("ja-JP", {
                                month: "numeric",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                        </time>
                      )}
                    </div>

                    {event.kind === "session" && (event.sanLoss > 0 || event.hpLoss > 0) && (
                      <div className="flex gap-3 text-xs">
                        {event.sanLoss > 0 && (
                          <span
                            className={`font-semibold ${
                              event.sanLoss >= 5 ? "text-red-400" : "text-yellow-400"
                            }`}
                          >
                            SAN -{event.sanLoss}
                          </span>
                        )}
                        {event.hpLoss > 0 && (
                          <span className="text-orange-400 font-semibold">
                            HP -{event.hpLoss}
                          </span>
                        )}
                      </div>
                    )}

                    {event.kind === "session" && event.summary && (
                      <p className="font-crimson text-coc-muted text-sm leading-relaxed whitespace-pre-wrap">
                        {event.summary}
                      </p>
                    )}

                    {event.kind === "dice" && (
                      <p className="text-xs text-coc-muted">
                        技能値: {event.skillValue} / ロール: {event.rollValue}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
