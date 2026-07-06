export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";
import { supabase, isSupabaseConfigured, PlayerFeedback } from "@/lib/supabase";

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

export default async function FeedbackResultsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const [{ data: scenario }, { data: rows }] = await Promise.all([
    supabase.from("scenarios").select("title").eq("id", id).single(),
    supabase
      .from("player_feedback")
      .select("*")
      .eq("scenario_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!scenario) notFound();

  const feedbackList = (rows ?? []) as PlayerFeedback[];
  const avgFun =
    feedbackList.length > 0
      ? feedbackList.reduce((s, f) => s + f.fun_score, 0) / feedbackList.length
      : null;

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
          <MessageSquarePlus size={20} className="text-coc-gold" />
          PL フィードバック一覧
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          PLから寄せられたフィードバックをKPが確認できます。
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <Link
          href={`/scenarios/${id}/feedback`}
          className="text-xs text-coc-gold hover:underline"
        >
          フィードバックフォームを見る →
        </Link>
      </div>

      {feedbackList.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">まだフィードバックはありません。</p>
          <p className="text-xs text-coc-muted mt-2">
            PLにフィードバックフォームのURLを共有しましょう。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {avgFun !== null && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
                集計（{feedbackList.length}件）
              </p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-coc-muted mb-1">楽しさ平均</p>
                  <div className="flex items-center gap-2">
                    <StarDisplay value={avgFun} />
                    <span className="text-sm font-bold text-coc-gold">{avgFun.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {feedbackList.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-medium text-coc-text">{f.player_name}</p>
                  {f.session_label && (
                    <p className="text-xs text-coc-muted">{f.session_label}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <StarDisplay value={f.fun_score} />
                  <p className="text-xs text-coc-muted mt-0.5">
                    {new Date(f.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              </div>
              {f.highlight && (
                <div className="mt-2 border-t border-coc-border pt-2">
                  <p className="text-xs font-medium text-coc-muted mb-0.5">印象的な場面</p>
                  <p className="text-sm text-coc-text whitespace-pre-wrap">{f.highlight}</p>
                </div>
              )}
              {f.improvement && (
                <div className="mt-2 border-t border-coc-border pt-2">
                  <p className="text-xs font-medium text-coc-muted mb-0.5">改善提案</p>
                  <p className="text-sm text-coc-text whitespace-pre-wrap">{f.improvement}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
