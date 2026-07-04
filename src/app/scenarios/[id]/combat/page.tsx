"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Swords,
  RotateCcw,
  Plus,
  Minus,
  Trash2,
  Bug,
  Skull,
} from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  Character,
  ScenarioParticipant,
  Creature,
} from "@/lib/supabase";

type ParticipantWithCharacter = ScenarioParticipant & {
  characters: Pick<
    Character,
    "id" | "name" | "dex" | "status" | "hp_current" | "hp_max"
  >;
};

type CreatureRow = Pick<Creature, "id" | "name" | "hp" | "dex">;

type Combatant = {
  id: string;
  type: "pc" | "enemy";
  characterId?: string;
  name: string;
  dex: number;
  hpCurrent: number;
  hpMax: number;
  acted: boolean;
};

export default function CombatPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [creatures, setCreatures] = useState<CreatureRow[]>([]);
  const [round, setRound] = useState(1);
  const [newName, setNewName] = useState("");
  const [newDex, setNewDex] = useState("");
  const [newHp, setNewHp] = useState("");

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
        .select("*, characters(id, name, dex, status, hp_current, hp_max)")
        .eq("scenario_id", scenarioId);

      const list = (participants ?? []) as ParticipantWithCharacter[];
      const pcCombatants: Combatant[] = list.map((p) => ({
        id: `pc-${p.characters.id}`,
        type: "pc" as const,
        characterId: p.characters.id,
        name: p.characters.name,
        dex: p.characters.dex,
        hpCurrent: p.characters.hp_current,
        hpMax: p.characters.hp_max,
        acted: false,
      }));

      const { data: creatureData } = await supabase
        .from("creatures")
        .select("id, name, hp, dex")
        .eq("scenario_id", scenarioId);

      setCreatures(
        ((creatureData ?? []) as CreatureRow[]).filter((c) => c.hp !== null)
      );

      setCombatants(pcCombatants.sort((a, b) => b.dex - a.dex));
      setLoading(false);
    })();
  }, [scenarioId]);

  const sorted = [...combatants].sort((a, b) => b.dex - a.dex);
  const allActed =
    combatants.length > 0 && combatants.every((c) => c.acted || c.hpCurrent <= 0);

  function toggleActed(id: string) {
    setCombatants((prev) =>
      prev.map((c) => (c.id === id ? { ...c, acted: !c.acted } : c))
    );
  }

  function adjustHp(id: string, delta: number) {
    setCombatants((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              hpCurrent: Math.max(0, Math.min(c.hpMax, c.hpCurrent + delta)),
            }
          : c
      )
    );
  }

  function removeEnemy(id: string) {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
  }

  function addEnemy() {
    const dexNum = parseInt(newDex, 10) || 0;
    const hpNum = parseInt(newHp, 10);
    if (!newName.trim() || isNaN(hpNum) || hpNum <= 0) return;
    setCombatants((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "enemy" as const,
        name: newName.trim(),
        dex: dexNum,
        hpCurrent: hpNum,
        hpMax: hpNum,
        acted: false,
      },
    ]);
    setNewName("");
    setNewDex("");
    setNewHp("");
  }

  function addCreatureAsEnemy(creature: CreatureRow) {
    if (!creature.hp) return;
    setCombatants((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "enemy" as const,
        name: creature.name,
        dex: creature.dex ?? 0,
        hpCurrent: creature.hp!,
        hpMax: creature.hp!,
        acted: false,
      },
    ]);
  }

  function nextRound() {
    setRound((r) => r + 1);
    setCombatants((prev) => prev.map((c) => ({ ...c, acted: false })));
  }

  function resetCombat() {
    setRound(1);
    setCombatants((prev) =>
      prev.filter((c) => c.type === "pc").map((c) => ({ ...c, acted: false }))
    );
  }

  function hpColor(current: number, max: number) {
    const pct = max > 0 ? current / max : 0;
    if (pct <= 0) return "text-coc-muted";
    if (pct <= 0.25) return "text-red-400";
    if (pct <= 0.5) return "text-yellow-400";
    return "text-green-400";
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
            戦闘管理
          </h1>
          <p className="text-xs text-coc-muted mt-1">
            PC+NPC統合イニシアチブ（DEX順）— 敵はリロードでリセット
          </p>
        </div>
        <button
          onClick={resetCombat}
          className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
        >
          <RotateCcw size={14} />
          リセット
        </button>
      </div>

      {/* Round counter */}
      <div className="mb-6 rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-4 text-center">
        <p className="text-xs text-coc-muted mb-1">現在ラウンド</p>
        <p className="text-4xl font-bold text-coc-gold tabular-nums">{round}</p>
      </div>

      {/* Creature quick-add */}
      {creatures.length > 0 && (
        <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface px-4 py-3">
          <p className="text-xs font-medium text-coc-muted mb-2 flex items-center gap-1.5">
            <Bug size={13} />
            このシナリオのクリーチャーから追加
          </p>
          <div className="flex flex-wrap gap-2">
            {creatures.map((c) => (
              <button
                key={c.id}
                onClick={() => addCreatureAsEnemy(c)}
                className="rounded-full border border-coc-border bg-coc-raised px-3 py-1 text-xs text-coc-text hover:border-coc-gold hover:text-coc-gold transition-colors"
              >
                {c.name}
                {c.dex !== null && (
                  <span className="ml-1 text-coc-muted">DEX{c.dex}</span>
                )}
                {c.hp !== null && (
                  <span className="ml-1 text-coc-muted">HP{c.hp}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add enemy form */}
      <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-4 py-4">
        <p className="text-xs font-medium text-coc-muted mb-3 flex items-center gap-1.5">
          <Skull size={13} />
          NPC/敵を追加
        </p>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="名前"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEnemy()}
            className="flex-1 min-w-[110px] rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
          />
          <input
            type="number"
            placeholder="DEX"
            value={newDex}
            onChange={(e) => setNewDex(e.target.value)}
            className="w-20 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
          />
          <input
            type="number"
            placeholder="最大HP"
            value={newHp}
            onChange={(e) => setNewHp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEnemy()}
            className="w-24 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
          />
          <button
            onClick={addEnemy}
            disabled={!newName.trim() || !newHp}
            className="flex items-center gap-1 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={15} />
            追加
          </button>
        </div>
      </div>

      {/* Initiative list */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">参加者がいません。</p>
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
            {sorted.map((c, index) => {
              const defeated = c.hpCurrent <= 0;
              const hpPct =
                c.hpMax > 0 ? (c.hpCurrent / c.hpMax) * 100 : 0;

              return (
                <div
                  key={c.id}
                  className={`rounded-xl border px-4 py-3 transition-colors ${
                    defeated
                      ? "border-coc-border bg-coc-raised opacity-60"
                      : c.acted
                      ? "border-coc-border bg-coc-raised opacity-75"
                      : "border-coc-border bg-coc-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-coc-border text-xs text-coc-muted">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={`font-medium ${
                              defeated
                                ? "text-coc-muted line-through"
                                : c.acted
                                ? "text-coc-muted line-through"
                                : "text-coc-text"
                            }`}
                          >
                            {c.name}
                          </p>
                          <span
                            className={`rounded-full border px-1.5 py-0.5 text-xs ${
                              c.type === "pc"
                                ? "border-blue-800 text-blue-400"
                                : "border-red-800 text-red-400"
                            }`}
                          >
                            {c.type === "pc" ? "PC" : "敵"}
                          </span>
                          {defeated && (
                            <span className="rounded-full border border-coc-border px-1.5 py-0.5 text-xs text-coc-muted">
                              倒れた
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-coc-muted">DEX {c.dex}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleActed(c.id)}
                        disabled={defeated}
                        className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors disabled:cursor-not-allowed ${
                          c.acted
                            ? "border-green-800 text-green-400"
                            : "border-coc-border text-coc-muted hover:border-coc-gold"
                        }`}
                      >
                        {c.acted ? "行動済み" : "未行動"}
                      </button>
                      {c.type === "enemy" && (
                        <button
                          onClick={() => removeEnemy(c.id)}
                          className="text-coc-muted hover:text-red-400 transition-colors"
                          aria-label="削除"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* HP section */}
                  <div>
                    <div className="flex items-end justify-between mb-1">
                      <span className="text-xs text-coc-muted">HP</span>
                      <span
                        className={`font-cinzel text-lg font-bold tabular-nums ${hpColor(c.hpCurrent, c.hpMax)}`}
                      >
                        {c.hpCurrent}
                        <span className="text-sm text-coc-muted font-normal">
                          /{c.hpMax}
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-coc-raised overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          hpPct <= 0
                            ? "bg-coc-muted"
                            : hpPct <= 25
                            ? "bg-red-500"
                            : hpPct <= 50
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${hpPct}%` }}
                      />
                    </div>
                    <div className="flex gap-1.5">
                      {[-5, -3, -1].map((delta) => (
                        <button
                          key={delta}
                          onClick={() => adjustHp(c.id, delta)}
                          disabled={defeated}
                          className="flex-1 flex items-center justify-center gap-0.5 rounded border border-red-900 bg-red-950/20 py-1 text-xs text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus size={10} />
                          {Math.abs(delta)}
                        </button>
                      ))}
                      <div className="w-px bg-coc-border" />
                      {[1, 3, 5].map((delta) => (
                        <button
                          key={delta}
                          onClick={() => adjustHp(c.id, delta)}
                          disabled={c.hpCurrent >= c.hpMax}
                          className="flex-1 flex items-center justify-center gap-0.5 rounded border border-green-900 bg-green-950/20 py-1 text-xs text-green-400 hover:bg-green-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus size={10} />
                          {delta}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
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
