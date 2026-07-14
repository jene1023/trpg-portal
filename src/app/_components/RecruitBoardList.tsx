"use client";

import { useState } from "react";
import Link from "next/link";
import { ScenarioDifficulty, ScenarioPlaytimeType } from "@/lib/supabase";

export type RecruitScenario = {
  id: string;
  title: string;
  synopsis: string | null;
  difficulty: ScenarioDifficulty | null;
  playtime_type: ScenarioPlaytimeType | null;
  min_players: number | null;
  max_players: number | null;
  estimated_hours: number | null;
  recruit_token: string | null;
  teaser_text: string | null;
};

const DIFFICULTY_LABELS: Record<ScenarioDifficulty, string> = {
  beginner: "初心者向け",
  intermediate: "中級",
  advanced: "上級",
};

const DIFFICULTY_COLORS: Record<ScenarioDifficulty, string> = {
  beginner: "text-green-400 border-green-800",
  intermediate: "text-yellow-400 border-yellow-800",
  advanced: "text-red-400 border-red-800",
};

const PLAYTIME_LABELS: Record<ScenarioPlaytimeType, string> = {
  short: "短編（〜3時間）",
  medium: "中編（3〜6時間）",
  long: "長編（6時間〜）",
};

type Props = { scenarios: RecruitScenario[] };

export default function RecruitBoardList({ scenarios }: Props) {
  const [difficultyFilter, setDifficultyFilter] = useState<ScenarioDifficulty | "all">("all");
  const [playtimeFilter, setPlaytimeFilter] = useState<ScenarioPlaytimeType | "all">("all");

  const filtered = scenarios.filter((s) => {
    if (difficultyFilter !== "all" && s.difficulty !== difficultyFilter) return false;
    if (playtimeFilter !== "all" && s.playtime_type !== playtimeFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-coc-muted">難易度:</span>
          {(["all", "beginner", "intermediate", "advanced"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                difficultyFilter === d
                  ? "border-coc-gold bg-coc-gold/10 text-coc-gold"
                  : "border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-text"
              }`}
            >
              {d === "all" ? "すべて" : DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-coc-muted">プレイ時間:</span>
          {(["all", "short", "medium", "long"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlaytimeFilter(p)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                playtimeFilter === p
                  ? "border-coc-gold bg-coc-gold/10 text-coc-gold"
                  : "border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-text"
              }`}
            >
              {p === "all" ? "すべて" : PLAYTIME_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-12 text-center">
          <p className="text-coc-muted">条件に合うシナリオが見つかりませんでした。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h2 className="font-cinzel text-lg font-bold text-coc-text">{s.title}</h2>
                  {(s.teaser_text ?? s.synopsis) && (
                    <p className="text-sm text-coc-muted mt-1 line-clamp-3">
                      {s.teaser_text ?? s.synopsis}
                    </p>
                  )}
                </div>
                <Link
                  href={`/scenarios/${s.id}/recruit`}
                  className="flex-shrink-0 rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
                >
                  参加申請
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {s.difficulty && (
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      DIFFICULTY_COLORS[s.difficulty]
                    }`}
                  >
                    {DIFFICULTY_LABELS[s.difficulty]}
                  </span>
                )}
                {s.playtime_type && (
                  <span className="rounded-full border border-coc-border px-2.5 py-0.5 text-xs text-coc-muted">
                    {PLAYTIME_LABELS[s.playtime_type]}
                  </span>
                )}
                {(s.min_players != null || s.max_players != null) && (
                  <span className="rounded-full border border-coc-border px-2.5 py-0.5 text-xs text-coc-muted">
                    {s.min_players != null && s.max_players != null
                      ? `${s.min_players}〜${s.max_players}人`
                      : s.min_players != null
                      ? `${s.min_players}人〜`
                      : `〜${s.max_players}人`}
                  </span>
                )}
                {s.estimated_hours != null && (
                  <span className="rounded-full border border-coc-border px-2.5 py-0.5 text-xs text-coc-muted">
                    約{s.estimated_hours}時間
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
