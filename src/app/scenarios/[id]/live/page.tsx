"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Radio } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import QuickStatEditor from "@/app/_components/QuickStatEditor";

type CharacterData = {
  id: string;
  name: string;
  hp_current: number;
  hp_max: number;
  mp_current: number;
  mp_max: number;
  san_current: number;
  san_max: number;
  status: string;
  con: number;
};

type ParticipantRow = {
  id: string;
  characters: CharacterData;
};

type DangerState = Record<string, { hp: number; san: number }>;

function isDanger(stats: { hp: number; san: number }, char: CharacterData): boolean {
  const hpPct = char.hp_max > 0 ? stats.hp / char.hp_max : 0;
  const sanPct = char.san_max > 0 ? stats.san / char.san_max : 0;
  return hpPct <= 0.25 || sanPct <= 0.25;
}

export default function LiveSessionPage() {
  const params = useParams();
  const id = params.id as string;

  const [scenarioTitle, setScenarioTitle] = useState<string>("");
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [dangerState, setDangerState] = useState<DangerState>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }

    async function fetchData() {
      const [{ data: scenario }, { data: parts }] = await Promise.all([
        supabase.from("scenarios").select("title").eq("id", id).single(),
        supabase
          .from("scenario_participants")
          .select("id, characters(id, name, hp_current, hp_max, mp_current, mp_max, san_current, san_max, status, con)")
          .eq("scenario_id", id)
          .order("created_at", { ascending: true }),
      ]);

      if (scenario) setScenarioTitle(scenario.title);

      const list = (parts ?? []) as ParticipantRow[];
      setParticipants(list);

      const initial: DangerState = {};
      list.forEach(({ characters: char }) => {
        initial[char.id] = { hp: char.hp_current, san: char.san_current };
      });
      setDangerState(initial);
      setLoading(false);
    }

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!isSupabaseConfigured || participants.length === 0) return;

    const channels = participants.map(({ characters: char }) =>
      supabase
        .channel(`live-${id}-${char.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "characters", filter: `id=eq.${char.id}` },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            const p = payload.new as { hp_current: number; san_current: number };
            setDangerState((prev: DangerState) => ({
              ...prev,
              [char.id]: { hp: p.hp_current, san: p.san_current },
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
          <Radio size={20} className="text-coc-gold" />
          ライブ進行
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          参加者全員のHP / SAN / MPをリアルタイムで一覧・即時更新
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
            const stats = dangerState[char.id];
            const danger = stats ? isDanger(stats, char) : false;

            return (
              <div
                key={participantId}
                className={`rounded-xl border bg-coc-surface px-5 py-4 transition-colors ${
                  danger
                    ? "border-red-600 ring-1 ring-red-700"
                    : "border-coc-border"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-coc-text">{char.name}</p>
                    {danger && (
                      <p className="text-xs text-red-400 font-semibold mt-0.5">
                        ⚠ 危険状態
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/characters/${char.id}`}
                    className="text-xs text-coc-muted hover:text-coc-gold transition-colors shrink-0"
                  >
                    詳細 →
                  </Link>
                </div>
                <QuickStatEditor
                  characterId={char.id}
                  hpCurrent={char.hp_current}
                  hpMax={char.hp_max}
                  mpCurrent={char.mp_current}
                  mpMax={char.mp_max}
                  sanCurrent={char.san_current}
                  sanMax={char.san_max}
                  con={char.con}
                />
              </div>
            );
          })}
        </div>
      )}

      {participants.length > 0 && (
        <div className="mt-6 rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-xs text-coc-muted">
          <span className="inline-block w-3 h-3 rounded-sm border border-red-600 bg-red-950/30 mr-1.5 align-middle" />
          赤枠 = HP / SANのいずれかが最大値の25%以下
        </div>
      )}
    </div>
  );
}
