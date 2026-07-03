"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, CalendarClock } from "lucide-react";
import { supabase, isSupabaseConfigured, Scenario, ScenarioStatus } from "@/lib/supabase";

type ReviewMap = Record<string, number>;

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

function isUpcomingSoon(scenario: Scenario): boolean {
  if (scenario.status !== "ongoing" || !scenario.next_session_at) return false;
  const diff = new Date(scenario.next_session_at).getTime() - Date.now();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

function formatNextSession(value: string): string {
  return new Date(value).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [reviewRatings, setReviewRatings] = useState<ReviewMap>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ScenarioStatus | "all">("all");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    async function load() {
      const [{ data: scenariosData }, { data: participantsData }, { data: reviewsData }] =
        await Promise.all([
          supabase.from("scenarios").select("*").order("created_at", { ascending: false }),
          supabase.from("scenario_participants").select("scenario_id"),
          supabase.from("scenario_reviews").select("scenario_id, rating"),
        ]);
      if (scenariosData) setScenarios(scenariosData as Scenario[]);
      if (participantsData) {
        const counts: Record<string, number> = {};
        for (const row of participantsData) {
          counts[row.scenario_id] = (counts[row.scenario_id] ?? 0) + 1;
        }
        setParticipantCounts(counts);
      }
      if (reviewsData) {
        const ratings: ReviewMap = {};
        for (const row of reviewsData) {
          ratings[row.scenario_id] = row.rating;
        }
        setReviewRatings(ratings);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered =
    statusFilter === "all"
      ? scenarios
      : scenarios.filter((s) => s.status === statusFilter);

  return (
    <div className="coc-page-enter mx-auto max-w-4xl px-4 py-8">
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
              {isUpcomingSoon(scenario) && (
                <div className="flex items-center gap-1.5 mb-3 w-fit rounded-full border border-coc-gold-dim bg-coc-raised px-2.5 py-1 text-xs font-medium text-coc-gold">
                  <CalendarClock size={12} />
                  次回予定: {formatNextSession(scenario.next_session_at as string)}
                </div>
              )}

              <div className="flex items-start justify-between gap-4 mb-2">
                <Link
                  href={`/scenarios/${scenario.id}`}
                  className="font-cinzel font-semibold text-coc-text text-lg leading-tight hover:text-coc-gold transition-colors"
                >
                  {scenario.title}
                </Link>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {scenario.status === "completed" && reviewRatings[scenario.id] != null && (
                    <span className="flex items-center gap-0.5 rounded-full border border-coc-gold-dim bg-coc-raised px-2 py-0.5 text-xs text-coc-gold">
                      {"★".repeat(reviewRatings[scenario.id])}
                      {"☆".repeat(5 - reviewRatings[scenario.id])}
                    </span>
                  )}
                  {(participantCounts[scenario.id] ?? 0) > 0 && (
                    <span className="flex items-center gap-1 rounded-full border border-coc-border px-2 py-0.5 text-xs text-coc-muted">
                      <Users size={11} />
                      {participantCounts[scenario.id]}
                    </span>
                  )}
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[scenario.status]}`}
                  >
                    {STATUS_LABELS[scenario.status]}
                  </span>
                </div>
              </div>

              {scenario.played_at && (
                <p className="text-xs text-coc-muted mb-2">
                  プレイ日: {scenario.played_at}
                </p>
              )}

              {scenario.next_session_at && !isUpcomingSoon(scenario) && (
                <p className="text-xs text-coc-muted mb-2">
                  次回予定: {formatNextSession(scenario.next_session_at)}
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
                <Link
                  href={`/scenarios/${scenario.id}/participants`}
                  className="text-xs text-coc-gold hover:underline"
                >
                  参加者管理 →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
