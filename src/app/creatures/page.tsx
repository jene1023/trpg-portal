"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { supabase, isSupabaseConfigured, Creature, Scenario } from "@/lib/supabase";

const STAT_DISPLAY: { key: keyof Creature; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "con", label: "CON" },
  { key: "pow", label: "POW" },
  { key: "dex", label: "DEX" },
  { key: "siz", label: "SIZ" },
  { key: "hp", label: "HP" },
  { key: "mp", label: "MP" },
];

function hasStats(creature: Creature): boolean {
  return STAT_DISPLAY.some(({ key }) => creature[key] !== null);
}

export default function CreaturesPage() {
  const searchParams = useSearchParams();
  const initialScenario = searchParams.get("scenario") ?? "all";
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [scenarioFilter, setScenarioFilter] = useState<string>(initialScenario);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    async function load() {
      const [{ data: creatureData }, { data: scenarioData }] = await Promise.all([
        supabase.from("creatures").select("*").order("created_at", { ascending: false }),
        supabase.from("scenarios").select("id, title").order("title"),
      ]);
      if (creatureData) setCreatures(creatureData as Creature[]);
      if (scenarioData) setScenarios(scenarioData as Scenario[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered =
    scenarioFilter === "all"
      ? creatures
      : scenarioFilter === "none"
      ? creatures.filter((c) => c.scenario_id === null)
      : creatures.filter((c) => c.scenario_id === scenarioFilter);

  const scenarioMap = Object.fromEntries(scenarios.map((s) => [s.id, s.title]));

  return (
    <div className="coc-page-enter mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">クリーチャー一覧</h1>
        <Link
          href="/creatures/new"
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-raised px-3 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors"
        >
          <Plus size={16} />
          クリーチャーを追加
        </Link>
      </div>

      <div className="mb-6">
        <select
          value={scenarioFilter}
          onChange={(e) => setScenarioFilter(e.target.value)}
          className="rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold transition-colors"
        >
          <option value="all">すべてのシナリオ</option>
          <option value="none">シナリオ未設定</option>
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-24 text-coc-muted font-crimson text-lg italic animate-pulse">
          クリーチャーを召喚しています...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="text-5xl text-coc-faint select-none">✦</span>
          <p className="text-coc-muted font-crimson text-lg italic text-center">
            クリーチャーが登録されていません。
          </p>
          <Link href="/creatures/new" className="mt-2 text-sm text-coc-gold hover:underline">
            + クリーチャーを追加する
          </Link>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex flex-col gap-4">
          {filtered.map((creature) => (
            <div
              key={creature.id}
              className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <Link
                    href={`/creatures/${creature.id}`}
                    className="font-cinzel font-semibold text-coc-text text-lg leading-tight hover:text-coc-gold transition-colors"
                  >
                    {creature.name}
                  </Link>
                  {creature.scenario_id && scenarioMap[creature.scenario_id] && (
                    <p className="text-xs text-coc-gold mt-0.5">
                      {scenarioMap[creature.scenario_id]}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {(creature.san_loss_success || creature.san_loss_failure) && (
                      <span className="text-xs text-red-400 font-medium">
                        SAN喪失: {creature.san_loss_success ?? "—"}/{creature.san_loss_failure ?? "—"}
                      </span>
                    )}
                    {creature.can_use_spells && (
                      <span className="rounded-full border border-purple-800 px-2 py-0.5 text-xs text-purple-400">
                        呪文使用可
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/creatures/${creature.id}`}
                  className="shrink-0 text-xs text-coc-muted hover:text-coc-gold border border-coc-border hover:border-coc-gold-dim rounded-md px-2 py-1 transition-colors"
                >
                  詳細
                </Link>
              </div>

              {creature.mythos_background && (
                <p className="text-sm text-coc-text line-clamp-2 mb-2">
                  {creature.mythos_background}
                </p>
              )}

              {hasStats(creature) && (
                <div className="mt-2 rounded-lg border border-coc-border bg-coc-raised px-3 py-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {STAT_DISPLAY.filter(({ key }) => creature[key] !== null).map(({ key, label }) => (
                      <div key={key} className="flex items-baseline gap-1">
                        <span className="text-xs text-coc-muted">{label}</span>
                        <span className="text-sm font-semibold text-coc-text">{creature[key] as number}</span>
                      </div>
                    ))}
                    {creature.armor && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-coc-muted">装甲</span>
                        <span className="text-sm font-semibold text-coc-text">{creature.armor}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
