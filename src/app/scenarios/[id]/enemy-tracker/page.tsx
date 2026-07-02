"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Skull, Plus, Minus, Trash2, RotateCcw, Bug } from "lucide-react";
import { supabase, isSupabaseConfigured, Creature } from "@/lib/supabase";

type Enemy = {
  id: string;
  name: string;
  hpMax: number;
  hpCurrent: number;
};

type CreatureRow = Pick<Creature, "id" | "name" | "hp">;

export default function EnemyTrackerPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;
  const searchParams = useSearchParams();

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [creatures, setCreatures] = useState<CreatureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newHp, setNewHp] = useState("");

  useEffect(() => {
    const name = searchParams.get("name");
    const hp = searchParams.get("hp");
    if (name && hp) {
      const hpNum = parseInt(hp, 10);
      if (!isNaN(hpNum) && hpNum > 0) {
        setEnemies([
          {
            id: crypto.randomUUID(),
            name,
            hpMax: hpNum,
            hpCurrent: hpNum,
          },
        ]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      const { data: creatureData } = await supabase
        .from("creatures")
        .select("id, name, hp")
        .eq("scenario_id", scenarioId);
      setCreatures(
        ((creatureData ?? []) as CreatureRow[]).filter((c) => c.hp !== null)
      );

      setLoading(false);
    })();
  }, [scenarioId]);

  function addEnemy() {
    const hpNum = parseInt(newHp, 10);
    if (!newName.trim() || isNaN(hpNum) || hpNum <= 0) return;
    setEnemies((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newName.trim(),
        hpMax: hpNum,
        hpCurrent: hpNum,
      },
    ]);
    setNewName("");
    setNewHp("");
  }

  function addCreatureAsEnemy(creature: CreatureRow) {
    if (!creature.hp) return;
    setEnemies((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: creature.name,
        hpMax: creature.hp!,
        hpCurrent: creature.hp!,
      },
    ]);
  }

  function adjustHp(id: string, delta: number) {
    setEnemies((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              hpCurrent: Math.max(0, Math.min(e.hpMax, e.hpCurrent + delta)),
            }
          : e
      )
    );
  }

  function removeEnemy(id: string) {
    setEnemies((prev) => prev.filter((e) => e.id !== id));
  }

  function resetAll() {
    setEnemies((prev) => prev.map((e) => ({ ...e, hpCurrent: e.hpMax })));
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
            <Skull size={20} className="text-coc-gold" />
            戦闘トラッカー
          </h1>
          <p className="text-xs text-coc-muted mt-1">
            ページをリロードするとリセットされます（ローカル状態のみ）
          </p>
        </div>
        {enemies.length > 0 && (
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
          >
            <RotateCcw size={14} />
            全員HP回復
          </button>
        )}
      </div>

      {/* Creature quick-add */}
      {creatures.length > 0 && (
        <div className="mb-5 rounded-xl border border-coc-border bg-coc-surface px-4 py-3">
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
                <span className="ml-1 text-coc-muted">HP{c.hp}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add enemy form */}
      <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-4 py-4">
        <p className="text-xs font-medium text-coc-muted mb-3">敵を追加</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="名前"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEnemy()}
            className="flex-1 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
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

      {/* Enemy list */}
      {enemies.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center">
          <Skull size={28} className="mx-auto text-coc-muted mb-3 opacity-40" />
          <p className="text-sm text-coc-muted">
            敵がいません。上のフォームから追加してください。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {enemies.map((enemy) => {
            const defeated = enemy.hpCurrent <= 0;
            const pct =
              enemy.hpMax > 0 ? (enemy.hpCurrent / enemy.hpMax) * 100 : 0;

            return (
              <div
                key={enemy.id}
                className={`rounded-xl border px-4 py-4 transition-colors ${
                  defeated
                    ? "border-coc-border bg-coc-raised opacity-60"
                    : "border-coc-border bg-coc-surface"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-medium ${
                        defeated
                          ? "text-coc-muted line-through"
                          : "text-coc-text"
                      }`}
                    >
                      {enemy.name}
                    </p>
                    {defeated && (
                      <span className="rounded-full border border-coc-border bg-coc-raised px-2 py-0.5 text-xs text-coc-muted">
                        倒れた
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeEnemy(enemy.id)}
                    className="text-coc-muted hover:text-red-400 transition-colors"
                    aria-label="削除"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* HP bar */}
                <div className="mb-3">
                  <div className="flex items-end justify-between mb-1">
                    <span className="text-xs text-coc-muted">HP</span>
                    <span
                      className={`font-cinzel text-2xl font-bold tabular-nums ${hpColor(enemy.hpCurrent, enemy.hpMax)}`}
                    >
                      {enemy.hpCurrent}
                      <span className="text-base text-coc-muted font-normal">
                        /{enemy.hpMax}
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-coc-raised overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct <= 0
                          ? "bg-coc-muted"
                          : pct <= 25
                          ? "bg-red-500"
                          : pct <= 50
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* +/- buttons */}
                <div className="flex gap-2">
                  {[-5, -3, -1].map((delta) => (
                    <button
                      key={delta}
                      onClick={() => adjustHp(enemy.id, delta)}
                      disabled={defeated}
                      className="flex-1 flex items-center justify-center gap-0.5 rounded-lg border border-red-900 bg-red-950/20 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus size={11} />
                      {Math.abs(delta)}
                    </button>
                  ))}
                  <div className="w-px bg-coc-border" />
                  {[1, 3, 5].map((delta) => (
                    <button
                      key={delta}
                      onClick={() => adjustHp(enemy.id, delta)}
                      disabled={enemy.hpCurrent >= enemy.hpMax}
                      className="flex-1 flex items-center justify-center gap-0.5 rounded-lg border border-green-900 bg-green-950/20 py-2 text-xs font-medium text-green-400 hover:bg-green-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus size={11} />
                      {delta}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
