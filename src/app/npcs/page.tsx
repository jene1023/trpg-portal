"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { supabase, isSupabaseConfigured, Npc } from "@/lib/supabase";

const STAT_DISPLAY = [
  { key: "str" as const, label: "STR" },
  { key: "con" as const, label: "CON" },
  { key: "pow" as const, label: "POW" },
  { key: "dex" as const, label: "DEX" },
  { key: "app" as const, label: "APP" },
  { key: "siz" as const, label: "SIZ" },
  { key: "int_stat" as const, label: "INT" },
  { key: "edu" as const, label: "EDU" },
  { key: "hp" as const, label: "HP" },
  { key: "mp" as const, label: "MP" },
];

function hasStats(npc: Npc): boolean {
  return STAT_DISPLAY.some(({ key }) => npc[key] !== null);
}

export default function NpcsPage() {
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [loading, setLoading] = useState(true);
  const [scenarioFilter, setScenarioFilter] = useState<string>("all");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    async function load() {
      const { data } = await supabase
        .from("npcs")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setNpcs(data as Npc[]);
      setLoading(false);
    }
    load();
  }, []);

  const scenarios = Array.from(
    new Set(npcs.map((n) => n.scenario_name ?? "").filter(Boolean))
  ).sort();

  const filtered =
    scenarioFilter === "all"
      ? npcs
      : npcs.filter((n) => (n.scenario_name ?? "") === scenarioFilter);

  return (
    <div className="coc-page-enter mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">NPC 一覧</h1>
        <Link
          href="/npcs/new"
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-raised px-3 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors"
        >
          <Plus size={16} />
          NPC を追加
        </Link>
      </div>

      {/* シナリオフィルタ */}
      <div className="mb-6">
        <select
          value={scenarioFilter}
          onChange={(e) => setScenarioFilter(e.target.value)}
          className="rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold transition-colors"
        >
          <option value="all">すべてのシナリオ</option>
          {scenarios.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-24 text-coc-muted font-crimson text-lg italic animate-pulse">
          NPCを召喚しています...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="text-5xl text-coc-faint select-none">✦</span>
          <p className="text-coc-muted font-crimson text-lg italic text-center">
            NPCが登録されていません。
          </p>
          <Link href="/npcs/new" className="mt-2 text-sm text-coc-gold hover:underline">
            + NPC を追加する
          </Link>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex flex-col gap-4">
          {filtered.map((npc) => (
            <div
              key={npc.id}
              className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <Link
                    href={`/npcs/${npc.id}`}
                    className="font-cinzel font-semibold text-coc-text text-lg leading-tight hover:text-coc-gold transition-colors"
                  >
                    {npc.name}
                  </Link>
                  {npc.scenario_name && (
                    <p className="text-xs text-coc-gold mt-0.5">{npc.scenario_name}</p>
                  )}
                </div>
                <Link
                  href={`/npcs/${npc.id}`}
                  className="shrink-0 text-xs text-coc-muted hover:text-coc-gold border border-coc-border hover:border-coc-gold-dim rounded-md px-2 py-1 transition-colors"
                >
                  詳細
                </Link>
              </div>
              {npc.appearance && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-coc-muted">外見: </span>
                  <span className="text-sm text-coc-text">{npc.appearance}</span>
                </div>
              )}
              {npc.purpose && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-coc-muted">目的: </span>
                  <span className="text-sm text-coc-text">{npc.purpose}</span>
                </div>
              )}

              {/* 能力値表示（入力済みのもののみ） */}
              {hasStats(npc) && (
                <div className="mt-3 rounded-lg border border-coc-border bg-coc-raised px-3 py-3">
                  <p className="text-xs font-medium text-coc-muted mb-2">能力値</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {STAT_DISPLAY.filter(({ key }) => npc[key] !== null).map(({ key, label }) => (
                      <div key={key} className="flex items-baseline gap-1">
                        <span className="text-xs text-coc-muted">{label}</span>
                        <span className="text-sm font-semibold text-coc-text">{npc[key]}</span>
                      </div>
                    ))}
                    {npc.db && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-coc-muted">DB</span>
                        <span className="text-sm font-semibold text-coc-text">{npc.db}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {npc.notes && (
                <div className="mt-3 rounded-lg border border-coc-border bg-coc-raised px-3 py-2">
                  <p className="text-xs font-medium text-coc-muted mb-1">KP メモ</p>
                  <p className="text-sm text-coc-text whitespace-pre-wrap">{npc.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
