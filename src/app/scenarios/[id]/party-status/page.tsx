"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Activity } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type CharacterData = {
  id: string;
  name: string;
  player_name: string | null;
  occupation: string | null;
  hp_current: number;
  hp_max: number;
  mp_current: number;
  mp_max: number;
  san_current: number;
  san_max: number;
  status: string;
};

type ParticipantRow = {
  id: string;
  characters: CharacterData;
};

function pct(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (current / max) * 100));
}

function barColor(ratio: number): string {
  if (ratio <= 25) return "bg-red-500";
  if (ratio <= 50) return "bg-yellow-400";
  return "bg-emerald-500";
}

function StatBar({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number;
}) {
  const ratio = pct(current, max);
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-xs text-coc-muted font-medium shrink-0">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-coc-bg overflow-hidden border border-coc-border">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor(ratio)}`}
          style={{ width: `${ratio}%` }}
        />
      </div>
      <span className="w-14 text-right text-xs text-coc-text shrink-0">
        {current}/{max}
      </span>
    </div>
  );
}

function dangerLevel(char: CharacterData): "critical" | "warning" | "ok" {
  const hpRatio = pct(char.hp_current, char.hp_max);
  const sanRatio = pct(char.san_current, char.san_max);
  if (hpRatio <= 25 || sanRatio <= 25) return "critical";
  if (hpRatio <= 50 || sanRatio <= 50) return "warning";
  return "ok";
}

export default function PartyStatusPage() {
  const params = useParams();
  const id = params.id as string;

  const [scenarioTitle, setScenarioTitle] = useState<string>("");
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [stats, setStats] = useState<Record<string, { hp_current: number; mp_current: number; san_current: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }

    async function fetchData() {
      const [{ data: scenario }, { data: parts }] = await Promise.all([
        supabase.from("scenarios").select("title").eq("id", id).single(),
        supabase
          .from("scenario_participants")
          .select("id, characters(id, name, player_name, occupation, hp_current, hp_max, mp_current, mp_max, san_current, san_max, status)")
          .eq("scenario_id", id)
          .order("created_at", { ascending: true }),
      ]);

      if (scenario) setScenarioTitle(scenario.title);

      const list = (parts ?? []) as ParticipantRow[];
      setParticipants(list);

      const initial: Record<string, { hp_current: number; mp_current: number; san_current: number }> = {};
      list.forEach(({ characters: char }) => {
        initial[char.id] = {
          hp_current: char.hp_current,
          mp_current: char.mp_current,
          san_current: char.san_current,
        };
      });
      setStats(initial);
      setLoading(false);
    }

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!isSupabaseConfigured || participants.length === 0) return;

    const channels = participants.map(({ characters: char }) =>
      supabase
        .channel(`party-status-${id}-${char.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "characters", filter: `id=eq.${char.id}` },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            const p = payload.new as { hp_current: number; mp_current: number; san_current: number };
            setStats((prev) => ({
              ...prev,
              [char.id]: {
                hp_current: p.hp_current,
                mp_current: p.mp_current,
                san_current: p.san_current,
              },
            }));
          }
        )
        .subscribe()
    );

    return () => { channels.forEach((ch) => supabase.removeChannel(ch)); };
  }, [id, participants]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
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
        <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <Activity size={20} className="text-coc-gold" />
          パーティステータスモニター
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          HP / SAN / MPをリアルタイムで監視 — セッション中のペース調整・SAN喪失タイミングの判断に
        </p>
      </div>

      {loading ? (
        <p className="text-coc-muted text-sm text-center py-8">読み込み中...</p>
      ) : participants.length === 0 ? (
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
        <div className="grid gap-4 sm:grid-cols-2">
          {participants.map(({ id: participantId, characters: char }) => {
            const live = stats[char.id];
            const display = live
              ? { ...char, hp_current: live.hp_current, mp_current: live.mp_current, san_current: live.san_current }
              : char;
            const danger = dangerLevel(display);

            return (
              <div
                key={participantId}
                className={`rounded-xl border bg-coc-surface px-5 py-4 transition-colors ${
                  danger === "critical"
                    ? "border-red-600 ring-1 ring-red-700"
                    : danger === "warning"
                    ? "border-yellow-700"
                    : "border-coc-border"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-coc-text">{char.name}</p>
                    {char.player_name && (
                      <p className="text-xs text-coc-muted">{char.player_name}</p>
                    )}
                    {char.occupation && (
                      <p className="text-xs text-coc-muted">{char.occupation}</p>
                    )}
                    {danger === "critical" && (
                      <p className="text-xs text-red-400 font-semibold mt-0.5">⚠ 危険状態</p>
                    )}
                    {danger === "warning" && (
                      <p className="text-xs text-yellow-400 font-semibold mt-0.5">⚡ 消耗中</p>
                    )}
                  </div>
                  <Link
                    href={`/characters/${char.id}`}
                    className="text-xs text-coc-muted hover:text-coc-gold transition-colors shrink-0"
                  >
                    詳細 →
                  </Link>
                </div>

                <div className="flex flex-col gap-2">
                  <StatBar label="HP" current={display.hp_current} max={display.hp_max} />
                  <StatBar label="SAN" current={display.san_current} max={display.san_max} />
                  <StatBar label="MP" current={display.mp_current} max={display.mp_max} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {participants.length > 0 && (
        <div className="mt-6 rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-xs text-coc-muted flex items-center gap-5 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" />
            50%超
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-yellow-400" />
            25〜50%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-500" />
            25%以下
          </span>
          <span className="ml-auto flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-coc-gold animate-pulse" />
            リアルタイム更新中
          </span>
        </div>
      )}
    </div>
  );
}
