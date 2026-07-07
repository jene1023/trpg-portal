export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Users, Clock } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioDifficulty, ScenarioPlaytimeType } from "@/lib/supabase";

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

type Props = { params: Promise<{ id: string }> };

export default async function ScenarioRecruitPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title, synopsis, difficulty, playtime_type, min_players, max_players, content_tags, next_session_at")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  return (
    <div className="coc-page-enter mx-auto max-w-xl px-4 py-8">
      <Link
        href={`/scenarios/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        シナリオ詳細へ戻る
      </Link>

      <div className="rounded-2xl border border-coc-border bg-coc-surface px-6 py-6">
        <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
          参加者募集
        </p>

        <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-4">
          {scenario.title}
        </h1>

        {/* メタ情報バッジ */}
        <div className="flex flex-wrap gap-2 mb-4">
          {scenario.difficulty && (
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${DIFFICULTY_COLORS[scenario.difficulty as ScenarioDifficulty]}`}
            >
              {DIFFICULTY_LABELS[scenario.difficulty as ScenarioDifficulty]}
            </span>
          )}
          {scenario.playtime_type && (
            <span className="inline-flex items-center gap-1 rounded-full border border-coc-border px-3 py-1 text-xs text-coc-muted">
              <Clock size={11} />
              {PLAYTIME_LABELS[scenario.playtime_type as ScenarioPlaytimeType]}
            </span>
          )}
          {(scenario.min_players != null || scenario.max_players != null) && (
            <span className="inline-flex items-center gap-1 rounded-full border border-coc-border px-3 py-1 text-xs text-coc-muted">
              <Users size={11} />
              {scenario.min_players != null && scenario.max_players != null
                ? `${scenario.min_players}〜${scenario.max_players}人`
                : scenario.min_players != null
                ? `${scenario.min_players}人〜`
                : `〜${scenario.max_players}人`}
            </span>
          )}
        </div>

        {/* 次回セッション予定 */}
        {scenario.next_session_at && (
          <div className="flex items-center gap-2 rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-2.5 mb-4 w-fit">
            <Calendar size={14} className="text-coc-gold flex-shrink-0" />
            <span className="text-sm text-coc-gold font-medium">
              {new Date(scenario.next_session_at).toLocaleString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* コンテンツ警告タグ */}
        {(scenario.content_tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="text-xs text-coc-muted self-center">⚠ 注意:</span>
            {(scenario.content_tags ?? []).map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border border-red-900 bg-red-950/30 px-2.5 py-0.5 text-xs text-red-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* シノプシス */}
        {scenario.synopsis && (
          <div className="mt-2">
            <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-2">
              あらすじ
            </p>
            <p className="text-sm text-coc-text whitespace-pre-wrap leading-relaxed">
              {scenario.synopsis}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
