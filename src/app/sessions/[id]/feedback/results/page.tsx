export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart2, Shield } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionFeedbackEntry } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

function StarDisplay({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rounded ? "text-coc-gold" : "text-coc-border"}>
          ★
        </span>
      ))}
    </span>
  );
}

function RatingBar({ rating, count, total }: { rating: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-coc-gold w-4 flex-shrink-0">{rating}★</span>
      <div className="flex-1 h-2 rounded-full bg-coc-border overflow-hidden">
        <div
          className="h-2 rounded-full bg-coc-gold transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-coc-muted w-6 flex-shrink-0 text-right">{count}</span>
    </div>
  );
}

export default async function FeedbackResultsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, character_id, session_number, title, characters(name)")
    .eq("id", id)
    .single();

  if (!session) notFound();

  const { data: rows } = await supabase
    .from("session_feedbacks")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: false });

  const feedbacks = (rows ?? []) as SessionFeedbackEntry[];
  const count = feedbacks.length;

  const avgRating = count > 0 ? feedbacks.reduce((s, f) => s + f.rating, 0) / count : null;

  const ratingDistribution = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: feedbacks.filter((f) => f.rating === r).length,
  }));

  const withComments = feedbacks.filter((f) => f.comment);

  const char = (session.characters as unknown as { name: string } | null);

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/sessions/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          セッション詳細
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">
          {char?.name} — セッション #{session.session_number}
        </p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <BarChart2 size={20} className="text-coc-gold" />
          フィードバック結果
        </h1>
        <p className="text-xs text-coc-muted mt-1">{session.title}</p>
      </div>

      <div className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-gold/5 px-3 py-2 mb-6">
        <Shield size={14} className="text-coc-gold flex-shrink-0" />
        <p className="text-xs text-coc-muted">このページはKP向けです。PLからのフィードバックを確認できます。</p>
      </div>

      {count === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-sm text-coc-muted">まだフィードバックはありません</p>
          <p className="text-xs text-coc-muted mt-1">
            PLに<Link href={`/sessions/${id}/feedback`} className="text-coc-gold hover:underline">フィードバックURL</Link>を共有してください。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
              総合評価 — {count}件
            </p>
            {avgRating !== null && (
              <div className="flex items-center gap-4 mb-5">
                <span className="text-4xl font-bold text-coc-gold">{avgRating.toFixed(1)}</span>
                <div>
                  <StarDisplay value={avgRating} />
                  <p className="text-xs text-coc-muted mt-0.5">平均 / 5.0</p>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {ratingDistribution.map(({ rating, count: c }) => (
                <RatingBar key={rating} rating={rating} count={c} total={count} />
              ))}
            </div>
          </div>

          {withComments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
                コメント（{withComments.length}件）
              </p>
              <div className="flex flex-col gap-3">
                {withComments.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StarDisplay value={f.rating} />
                        {f.is_anonymous && (
                          <span className="rounded-full border border-coc-border px-2 py-0.5 text-xs text-coc-muted">
                            匿名
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-coc-muted">
                        {new Date(f.created_at).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <p className="text-sm text-coc-text whitespace-pre-wrap border-l-2 border-coc-border pl-3 leading-relaxed">
                      {f.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {feedbacks.filter((f) => f.is_anonymous).length > 0 && (
            <div className="rounded-lg border border-coc-border bg-coc-raised px-4 py-3">
              <p className="text-xs text-coc-muted">
                匿名フィードバック {feedbacks.filter((f) => f.is_anonymous).length}件はコメント表示の対象外です。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
