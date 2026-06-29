"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { supabase, isSupabaseConfigured, Scenario, ScenarioStatus } from "@/lib/supabase";

const STATUS_LABELS: Record<ScenarioStatus, string> = {
  planning: "準備中",
  ongoing: "進行中",
  completed: "完了",
};

const STATUS_COLORS: Record<ScenarioStatus, string> = {
  planning: "text-coc-muted border-coc-border",
  ongoing: "text-coc-gold border-coc-gold-dim",
  completed: "text-green-400 border-green-800",
};

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ScenarioStatus | "all">("all");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    async function load() {
      const { data } = await supabase
        .from("scenarios")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setScenarios(data as Scenario[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered =
    statusFilter === "all"
      ? scenarios
      : scenarios.filter((s) => s.status === statusFilter);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">シナリオ一覧</h1>
        <Link
          href="/scenarios/new"
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-raised px-3 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors"
        >
          <Plus size={16} />
          シナリオを追加
        </Link>
      </div>

      {/* ステータスフィルタ */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ScenarioStatus | "all")}
          className="rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold transition-colors"
        >
          <option value="all">すべての進行状態</option>
          <option value="planning">準備中</option>
          <option value="ongoing">進行中</option>
          <option value="completed">完了</option>
        </select>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-24 text-coc-muted font-crimson text-lg italic animate-pulse">
          シナリオを読み込んでいます...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="text-5xl text-coc-faint select-none">✦</span>
          <p className="text-coc-muted font-crimson text-lg italic text-center">
            シナリオが登録されていません。
          </p>
          <Link href="/scenarios/new" className="mt-2 text-sm text-coc-gold hover:underline">
            + シナリオを追加する
          </Link>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex flex-col gap-4">
          {filtered.map((scenario) => (
            <div
              key={scenario.id}
              className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="font-cinzel font-semibold text-coc-text text-lg leading-tight">
                  {scenario.title}
                </p>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[scenario.status]}`}
                >
                  {STATUS_LABELS[scenario.status]}
                </span>
              </div>

              {scenario.played_at && (
                <p className="text-xs text-coc-muted mb-2">
                  プレイ日: {scenario.played_at}
                </p>
              )}

              {scenario.synopsis && (
                <div className="mb-2">
                  <p className="text-sm text-coc-text whitespace-pre-wrap">{scenario.synopsis}</p>
                </div>
              )}

              {scenario.gm_notes && (
                <div className="mt-3 rounded-lg border border-coc-border bg-coc-raised px-3 py-2">
                  <p className="text-xs font-medium text-coc-muted mb-1">GM メモ</p>
                  <p className="text-sm text-coc-text whitespace-pre-wrap">{scenario.gm_notes}</p>
                </div>
              )}

              <div className="mt-3 flex gap-3">
                <Link
                  href={`/scenarios/${scenario.id}/handouts`}
                  className="text-xs text-coc-gold hover:underline"
                >
                  ハンドアウト管理 →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
