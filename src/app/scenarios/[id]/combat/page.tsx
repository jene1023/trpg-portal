"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Swords, RotateCcw } from "lucide-react";
import { supabase, isSupabaseConfigured, Character, ScenarioParticipant } from "@/lib/supabase";

type ParticipantWithCharacter = ScenarioParticipant & {
  characters: Pick<Character, "id" | "name" | "dex" | "status">;
};

type Combatant = {
  characterId: string;
  name: string;
  dex: number;
  status: Character["status"];
  acted: boolean;
};

export default function CombatPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [round, setRound] = useState(1);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data: scenario } = await supabase
        .from("scenarios")
        .select("title")
        .eq("id", scenarioId)
        .single();
      setScenarioTitle(scenario?.title ?? "");

      const { data: participants } = await supabase
        .from("scenario_participants")
        .select("*, characters(id, name, dex, status)")
        .eq("scenario_id", scenarioId);

      const list = (participants ?? []) as ParticipantWithCharacter[];
      const sorted = list
        .map((p) => ({
          characterId: p.characters.id,
          name: p.characters.name,
          dex: p.characters.dex,
          status: p.characters.status,
          acted: false,
        }))
        .sort((a, b) => b.dex - a.dex);

      setCombatants(sorted);
      setLoading(false);
    })();
  }, [scenarioId]);

  const allActed = combatants.length > 0 && combatants.every((c) => c.acted);

  function toggleActed(characterId: string) {
    setCombatants((prev) =>
      prev.map((c) =>
        c.characterId === characterId ? { ...c, acted: !c.acted } : c
      )
    );
  }

  function nextRound() {
    setRound((r) => r + 1);
    setCombatants((prev) => prev.map((c) => ({ ...c, acted: false })));
  }

  function resetCombat() {
    setRound(1);
    setCombatants((prev) => prev.map((c) => ({ ...c, acted: false })));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
          <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
            <Swords size={20} className="text-coc-gold" />
            戦闘ラウンド管理
          </h1>
        </div>
        <button
          onClick={resetCombat}
          className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
        >
          <RotateCcw size={14} />
          リセット
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-4 text-center">
        <p className="text-xs text-coc-muted mb-1">現在ラウンド</p>
        <p className="text-4xl font-bold text-coc-gold tabular-nums">{round}</p>
      </div>

      {combatants.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">参加キャラクターが登録されていません。</p>
          <Link
            href={`/scenarios/${scenarioId}/participants`}
            className="mt-3 inline-block text-xs text-coc-gold hover:underline"
          >
            参加キャラクターを追加 →
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs text-coc-muted mb-3">DEX順イニシアチブ（高い順）</p>
          <div className="flex flex-col gap-2 mb-6">
            {combatants.map((c, index) => (
              <button
                key={c.characterId}
                onClick={() => toggleActed(c.characterId)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                  c.acted
                    ? "border-coc-border bg-coc-raised opacity-60"
                    : "border-coc-border bg-coc-surface hover:border-coc-gold"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-coc-border text-xs text-coc-muted">
                    {index + 1}
                  </span>
                  <div>
                    <p
                      className={`font-medium ${
                        c.acted ? "text-coc-muted line-through" : "text-coc-text"
                      }`}
                    >
                      {c.name}
                    </p>
                    <p className="text-xs text-coc-muted">DEX {c.dex}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${
                    c.acted
                      ? "border-green-800 text-green-400"
                      : "border-coc-border text-coc-muted"
                  }`}
                >
                  {c.acted ? "行動済み" : "未行動"}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={nextRound}
            disabled={!allActed}
            className="w-full rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-3 text-sm font-medium text-coc-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:border-coc-gold"
          >
            次のラウンドへ ({round + 1})
          </button>
        </>
      )}
    </div>
  );
}
