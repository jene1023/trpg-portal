export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  ScenarioPlayerRating,
  SessionReflection,
  PlayerFeedback,
  ReflectionRole,
} from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value / 5) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-coc-muted">{label}</span>
        <span className="text-xs font-semibold text-coc-gold">{value.toFixed(1)} / 5</span>
      </div>
      <div className="h-2 rounded-full bg-coc-border overflow-hidden">
        <div
          className="h-2 rounded-full bg-coc-gold"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

type UnifiedComment = {
  id: string;
  source: "rating" | "reflection" | "feedback";
  author: string | null;
  content: string;
  label?: string | null;
  created_at: string;
};

const SOURCE_LABELS: Record<UnifiedComment["source"], string> = {
  rating: "感想投票",
  reflection: "合同振り返り",
  feedback: "PLフィードバック",
};

const SOURCE_COLORS: Record<UnifiedComment["source"], string> = {
  rating: "text-coc-gold bg-coc-gold/10 border-coc-gold-dim",
  reflection: "text-blue-400 bg-blue-400/10 border-blue-800",
  feedback: "text-green-400 bg-green-400/10 border-green-800",
};

const ROLE_LABELS: Record<ReflectionRole, string> = {
  kp: "KP",
  pl: "PL",
  other: "その他",
};

export default async function FeedbackSummaryPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: participants } = await supabase
    .from("scenario_participants")
    .select("character_id")
    .eq("scenario_id", id);

  const characterIds = (participants ?? []).map((p: { character_id: string }) => p.character_id);

  let sessionIds: string[] = [];
  if (characterIds.length > 0) {
    const { data: sessionRows } = await supabase
      .from("sessions")
      .select("id")
      .in("character_id", characterIds);
    sessionIds = (sessionRows ?? []).map((s: { id: string }) => s.id);
  }

  const [{ data: ratingRows }, { data: reflectionRows }, { data: feedbackRows }] =
    await Promise.all([
      supabase
        .from("scenario_player_ratings")
        .select("*")
        .eq("scenario_id", id)
        .order("created_at", { ascending: false }),
      sessionIds.length > 0
        ? supabase
            .from("session_reflections")
            .select("*")
            .in("session_id", sessionIds)
            .order("created_at", { ascending: false })
        : { data: [] },
      supabase
        .from("player_feedback")
        .select("*")
        .eq("scenario_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const ratings = (ratingRows ?? []) as ScenarioPlayerRating[];
  const reflections = (reflectionRows ?? []) as SessionReflection[];
  const feedbacks = (feedbackRows ?? []) as PlayerFeedback[];

  const ratingCount = ratings.length;
  const avgFun =
    ratingCount > 0 ? ratings.reduce((s, r) => s + r.fun_rating, 0) / ratingCount : null;
  const avgHorror =
    ratingCount > 0 ? ratings.reduce((s, r) => s + r.horror_rating, 0) / ratingCount : null;
  const avgMystery =
    ratingCount > 0 ? ratings.reduce((s, r) => s + r.mystery_rating, 0) / ratingCount : null;
  const avgCharacter =
    ratingCount > 0 ? ratings.reduce((s, r) => s + r.character_rating, 0) / ratingCount : null;

  const comments: UnifiedComment[] = [
    ...ratings
      .filter((r) => r.comment)
      .map((r) => ({
        id: `rating-${r.id}`,
        source: "rating" as const,
        author: r.voter_name,
        content: r.comment!,
        label: null,
        created_at: r.created_at,
      })),
    ...reflections.map((r) => ({
      id: `reflection-${r.id}`,
      source: "reflection" as const,
      author: r.author_name,
      content: r.content,
      label: ROLE_LABELS[r.role as ReflectionRole] ?? r.role,
      created_at: r.created_at,
    })),
    ...feedbacks.flatMap((f) => {
      const items: UnifiedComment[] = [];
      if (f.highlight) {
        items.push({
          id: `feedback-hl-${f.id}`,
          source: "feedback" as const,
          author: f.player_name,
          content: f.highlight,
          label: "印象的な場面",
          created_at: f.created_at,
        });
      }
      if (f.improvement) {
        items.push({
          id: `feedback-imp-${f.id}`,
          source: "feedback" as const,
          author: f.player_name,
          content: f.improvement,
          label: "改善提案",
          created_at: f.created_at,
        });
      }
      return items;
    }),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenario.title}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <BarChart2 size={20} className="text-coc-gold" />
          フィードバック総括
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          感想投票・合同振り返り・PLフィードバックを統合した俯瞰ビュー
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-coc-text">{ratingCount}</p>
          <p className="text-xs text-coc-muted mt-1">感想投票</p>
        </div>
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-coc-text">{reflections.length}</p>
          <p className="text-xs text-coc-muted mt-1">振り返り</p>
        </div>
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-coc-text">{feedbacks.length}</p>
          <p className="text-xs text-coc-muted mt-1">PLフィードバック</p>
        </div>
      </div>

      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5 mb-4">
        <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
          4軸評価平均
          {ratingCount > 0 && (
            <span className="normal-case font-normal ml-2">（{ratingCount}件）</span>
          )}
        </p>
        {ratingCount === 0 ? (
          <p className="text-sm text-coc-muted text-center py-4">まだ評価がありません</p>
        ) : (
          <div className="space-y-3">
            <ScoreBar label="楽しさ" value={avgFun!} />
            <ScoreBar label="恐怖演出" value={avgHorror!} />
            <ScoreBar label="謎解き" value={avgMystery!} />
            <ScoreBar label="キャラクター活躍度" value={avgCharacter!} />
          </div>
        )}
      </div>

      <div>
        <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
          統合コメント
          {comments.length > 0 && (
            <span className="normal-case font-normal ml-2">（{comments.length}件 — 新着順）</span>
          )}
        </p>
        {comments.length === 0 ? (
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
            <p className="text-sm text-coc-muted">コメントはまだありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
              >
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${SOURCE_COLORS[c.source]}`}
                  >
                    {SOURCE_LABELS[c.source]}
                  </span>
                  {c.label && (
                    <span className="rounded-full border border-coc-border px-2 py-0.5 text-xs text-coc-muted">
                      {c.label}
                    </span>
                  )}
                  {c.author && (
                    <span className="text-sm font-medium text-coc-text">{c.author}</span>
                  )}
                  <span className="text-xs text-coc-muted ml-auto">
                    {new Date(c.created_at).toLocaleString("ja-JP")}
                  </span>
                </div>
                <p className="text-sm text-coc-text whitespace-pre-wrap border-l-2 border-coc-border pl-3 leading-relaxed">
                  {c.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
