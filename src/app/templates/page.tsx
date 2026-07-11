export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, BookMarked, Clock, Users } from "lucide-react";
import { supabase, isSupabaseConfigured, Scenario, ScenarioDifficulty, ScenarioPlaytimeType } from "@/lib/supabase";
import TemplateCloneButton from "@/app/_components/TemplateCloneButton";

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

type Props = {
  searchParams: Promise<{ difficulty?: string; tag?: string }>;
};

export default async function TemplatesPage({ searchParams }: Props) {
  const { difficulty, tag } = await searchParams;

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-coc-muted">Supabase が設定されていません。</p>
      </div>
    );
  }

  const { data: templates } = await supabase
    .from("scenarios")
    .select("*")
    .eq("is_template", true)
    .order("template_published_at", { ascending: false });

  const allTemplates = (templates ?? []) as Scenario[];

  const allTags = Array.from(
    new Set(allTemplates.flatMap((t) => t.content_tags ?? []))
  ).sort();

  const filtered = allTemplates
    .filter((t) => !difficulty || t.difficulty === difficulty)
    .filter((t) => !tag || (t.content_tags ?? []).includes(tag));

  return (
    <div className="coc-page-enter mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/scenarios"
            className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            <ArrowLeft size={16} />
            シナリオ一覧
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <BookMarked size={24} className="text-coc-gold" />
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-coc-text">テンプレートライブラリ</h1>
          <p className="text-sm text-coc-muted">KPが公開したシナリオテンプレートを複製して再利用できます</p>
        </div>
      </div>

      {/* フィルタ */}
      <div className="flex flex-wrap gap-2 mb-4">
        <a
          href="/templates"
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            !difficulty
              ? "border-coc-gold bg-coc-gold/10 text-coc-gold"
              : "border-coc-border bg-coc-raised text-coc-muted hover:text-coc-text"
          }`}
        >
          すべての難易度
        </a>
        {(["beginner", "intermediate", "advanced"] as ScenarioDifficulty[]).map((d) => (
          <a
            key={d}
            href={`/templates?difficulty=${d}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              difficulty === d
                ? "border-coc-gold bg-coc-gold/10 text-coc-gold"
                : "border-coc-border bg-coc-raised text-coc-muted hover:text-coc-text"
            }`}
          >
            {DIFFICULTY_LABELS[d]}
          </a>
        ))}
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-6">
          <span className="text-xs text-coc-muted">コンテンツ:</span>
          {allTags.map((t) => (
            <a
              key={t}
              href={`/templates?tag=${encodeURIComponent(t)}${difficulty ? `&difficulty=${difficulty}` : ""}`}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                tag === t
                  ? "border-red-700 bg-red-950/40 text-red-400"
                  : "border-coc-border bg-coc-surface text-coc-muted hover:text-coc-text"
              }`}
            >
              {t}
            </a>
          ))}
          {(difficulty || tag) && (
            <a href="/templates" className="text-xs text-coc-muted hover:text-coc-text ml-1">
              クリア
            </a>
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="text-5xl text-coc-faint select-none">✦</span>
          <p className="text-coc-muted font-crimson text-lg italic text-center">
            テンプレートが見つかりません。
          </p>
          <p className="text-sm text-coc-muted text-center">
            シナリオ詳細ページの「テンプレートとして公開」から追加できます。
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col gap-4">
          {filtered.map((template) => (
            <div
              key={template.id}
              className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="font-cinzel font-semibold text-coc-text text-lg leading-tight">
                    {template.title}
                  </h2>
                  {template.template_published_at && (
                    <p className="text-xs text-coc-muted mt-0.5">
                      公開: {new Date(template.template_published_at).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
                  {template.difficulty && (
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[template.difficulty as ScenarioDifficulty]}`}>
                      {DIFFICULTY_LABELS[template.difficulty as ScenarioDifficulty]}
                    </span>
                  )}
                  {template.playtime_type && (
                    <span className="rounded-full border border-coc-border px-2.5 py-0.5 text-xs text-coc-muted flex items-center gap-1">
                      <Clock size={10} />
                      {PLAYTIME_LABELS[template.playtime_type as ScenarioPlaytimeType]}
                    </span>
                  )}
                  {(template.min_players != null || template.max_players != null) && (
                    <span className="rounded-full border border-coc-border px-2.5 py-0.5 text-xs text-coc-muted flex items-center gap-1">
                      <Users size={10} />
                      {template.min_players != null && template.max_players != null
                        ? `${template.min_players}〜${template.max_players}人`
                        : template.min_players != null
                        ? `${template.min_players}人〜`
                        : `〜${template.max_players}人`}
                    </span>
                  )}
                </div>
              </div>

              {template.synopsis && (
                <p className="text-sm text-coc-text whitespace-pre-wrap mb-3">{template.synopsis}</p>
              )}

              {(template.content_tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-xs text-coc-muted self-center">注意:</span>
                  {(template.content_tags ?? []).map((ct: string) => (
                    <span
                      key={ct}
                      className="rounded-full border border-red-900 bg-red-950/30 px-2 py-0.5 text-xs text-red-400"
                    >
                      {ct}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 mt-4">
                <Link
                  href={`/scenarios/${template.id}`}
                  className="text-xs text-coc-muted hover:text-coc-text transition-colors"
                >
                  詳細を見る →
                </Link>
                <TemplateCloneButton templateId={template.id} templateTitle={template.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
