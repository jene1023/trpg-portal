export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart2, MessageSquarePlus } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionFeedbackPost } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

function StarDisplay({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex gap-0.5 text-sm">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rounded ? "text-coc-gold" : "text-coc-border"}>
          ★
        </span>
      ))}
    </span>
  );
}

function RatingBar({ label, avg, count }: { label: string; avg: number; count: number }) {
  const pct = Math.round((avg / 5) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-coc-muted">{label}</span>
        <span className="text-xs font-bold text-coc-gold">{avg.toFixed(1)}</span>
      </div>
      <div className="h-2 rounded-full bg-coc-raised overflow-hidden">
        <div
          className="h-full rounded-full bg-coc-gold transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-1 mt-1">
        <StarDisplay value={avg} />
        <span className="text-xs text-coc-muted">（{count}件）</span>
      </div>
    </div>
  );
}

export default async function FeedbackResultsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const [{ data: scenario }, { data: rows }] = await Promise.all([
    supabase.from("scenarios").select("title").eq("id", id).single(),
    supabase
      .from("session_feedbacks")
      .select("*")
      .eq("scenario_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!scenario) notFound();

  const feedbackList = (rows ?? []) as SessionFeedbackPost[];
  const count = feedbackList.length;

  const avgFun = count > 0 ? feedbackList.reduce((s, f) => s + f.fun_rating, 0) / count : null;
  const avgScare = count > 0 ? feedbackList.reduce((s, f) => s + f.scare_rating, 0) / count : null;
  const avgPace = count > 0 ? feedbackList.reduce((s, f) => s + f.pace_rating, 0) / count : null;

  const withHighlight = feedbackList.filter((f) => f.highlight);
  const withImprovement = feedbackList.filter((f) => f.improvement);
  const withSafety = feedbackList.filter((f) => f.safety_concern);

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
        <Link
          href={`/scenarios/${id}/feedback`}
          className="flex items-center gap-1.5 text-xs text-coc-gold hover:underline"
        >
          <MessageSquarePlus size={14} />
          フィードバックフォーム
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenario.title}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <BarChart2 size={20} className="text-coc-gold" />
          フィードバック集計（KP用）
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          PLから寄せられたフィードバックの集計結果です。自由記述は匿名化して表示されます。
        </p>
      </div>

      {feedbackList.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">まだフィードバックはありません。</p>
          <p className="text-xs text-coc-muted mt-2">
            PLにフィードバックフォームのURLを共有しましょう。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-5">
              評価平均（{count}件）
            </p>
            <div className="flex flex-col gap-4">
              {avgFun !== null && <RatingBar label="楽しさ" avg={avgFun} count={count} />}
              {avgScare !== null && <RatingBar label="怖さ" avg={avgScare} count={count} />}
              {avgPace !== null && <RatingBar label="ペース" avg={avgPace} count={count} />}
            </div>
          </div>

          {withHighlight.length > 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
                ハイライト（{withHighlight.length}件）
              </p>
              <div className="flex flex-col gap-3">
                {withHighlight.map((f) => (
                  <div key={f.id} className="border-l-2 border-coc-gold-dim pl-4">
                    <p className="text-sm text-coc-text whitespace-pre-wrap">{f.highlight}</p>
                    <p className="text-xs text-coc-muted mt-1">
                      {f.is_anonymous ? "匿名" : "投稿者"} ·{" "}
                      {new Date(f.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {withImprovement.length > 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
                改善点（{withImprovement.length}件）
              </p>
              <div className="flex flex-col gap-3">
                {withImprovement.map((f) => (
                  <div key={f.id} className="border-l-2 border-coc-border pl-4">
                    <p className="text-sm text-coc-text whitespace-pre-wrap">{f.improvement}</p>
                    <p className="text-xs text-coc-muted mt-1">
                      {f.is_anonymous ? "匿名" : "投稿者"} ·{" "}
                      {new Date(f.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {withSafety.length > 0 && (
            <div className="rounded-xl border border-yellow-900 bg-yellow-950/20 px-5 py-5">
              <p className="text-xs font-medium text-yellow-500 uppercase tracking-widest mb-4">
                セーフティ懸念（{withSafety.length}件）
              </p>
              <div className="flex flex-col gap-3">
                {withSafety.map((f) => (
                  <div key={f.id} className="border-l-2 border-yellow-700 pl-4">
                    <p className="text-sm text-coc-text whitespace-pre-wrap">{f.safety_concern}</p>
                    <p className="text-xs text-coc-muted mt-1">
                      {f.is_anonymous ? "匿名" : "投稿者"} ·{" "}
                      {new Date(f.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
              全フィードバック一覧
            </p>
            <div className="flex flex-col gap-4">
              {feedbackList.map((f, i) => (
                <div
                  key={f.id}
                  className="border-b border-coc-border last:border-0 pb-4 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-coc-muted">
                      #{i + 1} · {f.is_anonymous ? "匿名" : "投稿者"}
                    </p>
                    <p className="text-xs text-coc-muted">
                      {new Date(f.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-coc-muted">楽しさ</span>
                      <div className="mt-0.5 flex items-center gap-1">
                        <StarDisplay value={f.fun_rating} />
                        <span className="text-coc-gold font-bold">{f.fun_rating}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-coc-muted">怖さ</span>
                      <div className="mt-0.5 flex items-center gap-1">
                        <StarDisplay value={f.scare_rating} />
                        <span className="text-coc-gold font-bold">{f.scare_rating}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-coc-muted">ペース</span>
                      <div className="mt-0.5 flex items-center gap-1">
                        <StarDisplay value={f.pace_rating} />
                        <span className="text-coc-gold font-bold">{f.pace_rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
