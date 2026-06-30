export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, Character, ScenarioParticipant } from "@/lib/supabase";
import PartyStatAdjuster from "@/app/_components/PartyStatAdjuster";

type ParticipantWithCharacter = ScenarioParticipant & {
  characters: Character;
};

type Props = { params: Promise<{ id: string }> };

function statColor(current: number, max: number): string {
  if (max <= 0) return "text-coc-muted";
  const ratio = current / max;
  if (ratio <= 0.25) return "text-red-400";
  if (ratio <= 0.5) return "text-yellow-400";
  return "text-green-400";
}

function StatBar({ label, current, max }: { label: string; current: number; max: number }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const barColor =
    ratio <= 0.25 ? "bg-red-500" : ratio <= 0.5 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-coc-muted">{label}</span>
        <span className={`text-sm font-bold tabular-nums ${statColor(current, max)}`}>
          {current}
          <span className="text-xs text-coc-muted font-normal">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-coc-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

export default async function PartyViewPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: participants } = await supabase
    .from("scenario_participants")
    .select("*, characters(*)")
    .eq("scenario_id", id)
    .order("created_at", { ascending: true });

  const list = (participants ?? []) as ParticipantWithCharacter[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenario.title}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">パーティービュー</h1>
        <p className="text-xs text-coc-muted mt-1">参加者全員のHP / MP / SANを一覧確認</p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">参加キャラクターが登録されていません。</p>
          <Link
            href={`/scenarios/${id}/participants`}
            className="mt-3 inline-block text-xs text-coc-gold hover:underline"
          >
            参加キャラクターを追加 →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {list.map(({ characters: char }) => {
            const isDead = char.status === "dead";
            const isInsane = char.status === "insane";

            return (
              <div
                key={char.id}
                className={`rounded-xl border bg-coc-surface px-5 py-4 ${
                  isDead
                    ? "border-red-900 opacity-60"
                    : isInsane
                    ? "border-purple-700"
                    : "border-coc-border"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-coc-text">{char.name}</p>
                    {char.player_name && (
                      <p className="text-xs text-coc-muted">PL: {char.player_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isDead && (
                      <span className="rounded-full border border-red-800 px-2 py-0.5 text-xs text-red-400">
                        死亡
                      </span>
                    )}
                    {isInsane && (
                      <span className="rounded-full border border-purple-700 px-2 py-0.5 text-xs text-purple-400">
                        狂気
                      </span>
                    )}
                    <Link
                      href={`/characters/${char.id}`}
                      className="text-xs text-coc-gold hover:underline"
                    >
                      詳細 →
                    </Link>
                  </div>
                </div>

                <div className="flex gap-4 flex-wrap">
                  <StatBar label="HP" current={char.hp_current} max={char.hp_max} />
                  <StatBar label="MP" current={char.mp_current} max={char.mp_max} />
                  <StatBar label="SAN" current={char.san_current} max={char.san_max} />
                </div>

                <PartyStatAdjuster
                  characterId={char.id}
                  hpCurrent={char.hp_current}
                  hpMax={char.hp_max}
                  mpCurrent={char.mp_current}
                  mpMax={char.mp_max}
                  sanCurrent={char.san_current}
                  sanMax={char.san_max}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-xs text-coc-muted text-center">
        <span className="inline-flex items-center gap-3">
          <span className="text-green-400">■</span> 50%超
          <span className="text-yellow-400">■</span> 25〜50%
          <span className="text-red-400">■</span> 25%以下
        </span>
      </div>
    </div>
  );
}
